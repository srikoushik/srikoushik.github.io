# srikoushik.github.io

Personal site — a single, text-first page at
[srikoushik.github.io](https://srikoushik.github.io).

Built with [Astro](https://astro.build) and [shadcn/ui](https://ui.shadcn.com)
on Tailwind 4. Requires **Node ≥ 22.12**.

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
  content/site.ts        all page copy and profile links — edit text here
  pages/index.astro      the page
  pages/404.astro        not-found page
  layouts/BaseLayout.astro
  components/
    Seo.astro            metadata, Open Graph, JSON-LD
    ThemeToggle.astro    light / dark / system
    Section.astro
    SocialLinks.astro
    ui/                  shadcn components (owned source, edit freely)
  styles/global.css      Tailwind + theme tokens
tests/                   Playwright specs
```

**To change any wording, edit `src/content/site.ts`.** Nothing else needs
touching. TypeScript fails the build if an entry is malformed.

## Things worth knowing before you change something

**The page ships zero JavaScript.** shadcn components are React, but Astro
renders them to static HTML at build time as long as no `client:*` directive
is used. Adding one ships a React runtime (~45 KB gzipped) to a page that is
otherwise pure text. `tests/build-output.spec.ts` fails if any script is
requested.

**The theme toggle is deliberately vanilla JavaScript**, not a React island,
for the same reason. It has two parts: an inline resolver in `<head>` that
applies the theme *during parsing*, and the control's own script. The
resolver must stay inline and synchronous — deferring it paints a light
frame before correcting itself, which is visible on every load.

**Theme preference stores the literal choice** (`light` / `dark` / `system`),
never the resolved theme. Storing `dark` for a system preference would
silently destroy the system option.

**Tailwind 4 is configured CSS-first.** There is no `tailwind.config.js`;
theme tokens live in `src/styles/global.css`. Dark mode keys off a `dark`
class on `<html>`.

**Adding shadcn components:** `npx shadcn@latest add <name>`. They land in
`src/components/ui/` as source you own.

## Analytics

Umami Cloud, emitted only in production builds and only when
`PUBLIC_UMAMI_WEBSITE_ID` is set — so local development never reports
traffic. Copy `.env.example` to `.env` to run it locally.

Outbound clicks are tracked declaratively via `data-umami-event` attributes,
so links keep working with JavaScript disabled. Event names must stay under
50 characters and must be unique per link; a test enforces both. **Renaming
an event fragments its historical data.**

## Deployment

Pushing to `dev` triggers `.github/workflows/deploy.yml`, which builds and
publishes via GitHub Pages Actions.

Two settings live outside this repo:

- Repository **Settings → Pages → Source** must be **GitHub Actions**.
- `PUBLIC_UMAMI_WEBSITE_ID` is read from a repository **variable**.

`master` is no longer a deploy target. It previously had its entire contents
replaced on every deploy, which destroyed anything else committed there.
