# srikoushik.github.io

Personal site — a text-first card and an About page at
[srikoushik.github.io](https://srikoushik.github.io).

Built with [Astro](https://astro.build) on Tailwind 4. No UI framework.
Requires **Node ≥ 22.12**.

## Getting started

```sh
npm install
npm run dev      # http://localhost:4321
```

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Playwright suite (builds first, then runs) |
| `npm run typecheck` | `astro check` |

## Where things live

```
src/
  content/site.ts        all page copy and links — edit text here
  pages/index.astro      the card
  pages/about.astro      the prose, tech stack and deeper links
  pages/404.astro        not-found page
  layouts/BaseLayout.astro
  components/
    Seo.astro            metadata, Open Graph, JSON-LD
    ThemeToggle.astro    light / dark / system
    OutboundLink.astro   a link that leaves the site
  styles/global.css      Tailwind + theme tokens
tests/                   Playwright specs
```

**To change any wording, edit `src/content/site.ts`.** Nothing else needs
touching. TypeScript fails the build if an entry is malformed.

## Things worth knowing before you change something

**The page ships zero JavaScript.** There is no UI framework — every page is
static markup plus two inline scripts. `tests/build-output.spec.ts` fails if
any script is requested over the network.

**The theme toggle is deliberately vanilla JavaScript.** It has two parts: an
inline resolver in `<head>` that applies the theme *during parsing*, and the
control's own script. The resolver must stay inline and synchronous —
deferring it paints a light frame before correcting itself, which is visible
on every load.

**Theme preference stores the literal choice** (`light` / `dark` / `system`),
never the resolved theme. Storing `dark` for a system preference would
silently destroy the system option.

**About is a route, not a toggle.** The design it came from swapped the two
views in place; here it is `/about` so the prose is linkable, crawlable, and
its own Umami pageview. That means the theme has to survive a real page
load — `tests/navigation.spec.ts` covers it.

**Tailwind 4 is configured CSS-first.** There is no `tailwind.config.js`;
theme tokens live in `src/styles/global.css`. Dark mode keys off a `dark`
class on `<html>`.

**Tailwind scans `src/**/*.astro` and nothing else.** `global.css` imports
with `source(none)` and declares that one path, rather than letting automatic
detection sweep in every file git does not ignore. English is full of words
that are also utility names, so prose was compiling: a comment in a test that
mentioned `rounded-lg`, and config comments reading "absolute URLs" and
"static markup", each emitted a real rule into the shipped stylesheet.
Templates are the only thing here that writes a class attribute — if that
ever stops being true, add the path rather than removing the restriction.

**The palette is warm paper in oklch**, from the "flat surfaces" design. Four
ink levels (`foreground`, `muted-foreground`, `faint`, `border`) over two
surfaces (`background`, `muted`). Every tone carries a little chroma on a
yellow-orange hue, which is what keeps light mode reading as paper rather
than white and dark mode as ink rather than black.

The token names are shadcn's, but shadcn is not a dependency — nothing here
ever rendered a shadcn component. Only the tokens the site actually uses are
declared; shadcn's `card`, `popover`, `primary`, `secondary`, `accent`,
`destructive` and `input` were shipping to every visitor in both `:root` and
`.dark` without a single reference. If you want a shadcn component,
`npx shadcn@latest init` restores `components.json`, the React toolchain and
the full token set.

**Typography is Newsreader**, and the whole site is set in it — from 10px
eyebrows to the 44px name. `global.css` imports the two-axis (`opsz` + `wght`)
file rather than the smaller weight-only one: Newsreader's optical-size axis
defaults to 16, so the weight-only file would set the name in letterforms cut
for body copy. It costs 132 KB against 58 KB for the latin subset.

## The profile photo

`src/assets/me.jpg` (512×512, the avatar) and `public/me.jpg` (1200×1200, the
share card) are square crops with the frame baked into the file rather than
left to `object-cover` — on a 2:3 portrait, centring would cut the head off.

The uncropped original is **not** in the repo. To regenerate from a new
source photo, the crop that produced the current files was:

```js
const CROP = { left: 345, top: 90, width: 2110, height: 2110 };
sharp('me-source.jpg').extract(CROP).resize(512, 512).toFile('src/assets/me.jpg');
sharp('me-source.jpg').extract(CROP).resize(1200, 1200).toFile('public/me.jpg');
```

`public/me.jpg` is served from `public/` rather than `astro:assets` because
`og:image` needs a URL that does not change between builds.

## Analytics

Umami Cloud, emitted only in production builds and only when
`PUBLIC_UMAMI_WEBSITE_ID` is set — so local development never reports traffic.

**Do not put that variable in a `.env`.** The tracker is gated on `PROD`, so
`astro dev` ignores it either way, and `npm test` builds for production and
asserts the tracker is *absent* — a populated `.env` fails a correct build.
To exercise it locally, pass it for one command:

```sh
PUBLIC_UMAMI_WEBSITE_ID=... npm run build
```

Outbound clicks are tracked declaratively via `data-umami-event` attributes,
so links keep working with JavaScript disabled. Event names must stay under
50 characters and must be unique per link *and across routes*; tests enforce
both. **Renaming an event fragments its historical data.**

## Running the tests

`npm test` builds for production and runs Playwright against the built output,
because what it asserts — no-flash first paint, emitted metadata, JS payload —
are properties of the build, not the dev server.

**Stop any dev server on port 4321 first.** `playwright.config.ts` sets
`reuseExistingServer: !process.env.CI`, so a running dev server is silently
used instead of a production build. The sitemap 404s and the dev toolbar adds
a second `h1`, giving three failures unrelated to whatever you changed.

## Deployment

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds and
publishes via GitHub Pages Actions. `master` is the only branch: it is the
source of truth and the deploy trigger.

The two-branch split this repo used to have existed because the old deploy
force-pushed built output to `master`, wiping it on every publish, so source
had to live on `dev`. Publishing now goes through an ephemeral Pages artifact
and nothing writes to a branch, which is what made the split pointless.

Actions in the workflow are pinned to **commit SHAs**, not tags, with the
version in a trailing comment. Tags are mutable and that job holds
`pages: write` plus `id-token: write`, so a retagged third-party action could
publish to the live site. Dependabot updates the SHA and its comment together.

Two settings live outside this repo:

- Repository **Settings → Pages → Source** must be **GitHub Actions**.
- `PUBLIC_UMAMI_WEBSITE_ID` is read from a repository **variable**. Without
  it the build silently omits the tracker.
