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

**The palette is warm paper in oklch**, from the "flat surfaces" design. Four
ink levels (`foreground`, `muted-foreground`, `faint`, `border`) over two
surfaces (`background`, `muted`). Every tone carries a little chroma on a
yellow-orange hue, which is what keeps light mode reading as paper rather
than white and dark mode as ink rather than black.

The token names are shadcn's, but shadcn is not a dependency — nothing here
ever rendered a shadcn component. If you want one, `npx shadcn@latest init`
restores `components.json` and the React toolchain.

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
`PUBLIC_UMAMI_WEBSITE_ID` is set — so local development never reports
traffic. Copy `.env.example` to `.env` to run it locally.

Outbound clicks are tracked declaratively via `data-umami-event` attributes,
so links keep working with JavaScript disabled. Event names must stay under
50 characters and must be unique per link *and across routes*; tests enforce
both. **Renaming an event fragments its historical data.**

## Deployment

Pushing to `dev` triggers `.github/workflows/deploy.yml`, which builds and
publishes via GitHub Pages Actions.

Two settings live outside this repo:

- Repository **Settings → Pages → Source** must be **GitHub Actions**.
- `PUBLIC_UMAMI_WEBSITE_ID` is read from a repository **variable**.

`master` is no longer a deploy target. It previously had its entire contents
replaced on every deploy, which destroyed anything else committed there.
