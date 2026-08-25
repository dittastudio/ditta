# ditta

The marketing site for [ditta](https://ditta.studio) — a London-based, design-led web development studio.

It's a **Nuxt 4** app rendering content from **Storyblok**, styled with **Tailwind CSS v4**.

## Getting started

Requires Node `^20.19` or `>=22.12` (Nuxt 4's requirement — the repo doesn't pin a version) and npm.

```bash
git clone https://github.com/dittastudio/ditta.git
cd ditta
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

The dev server runs on <http://localhost:3000>.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NUXT_STORYBLOK_TOKEN` | Storyblok content delivery API token. **Required** — nothing renders without it. |
| `NUXT_STORYBLOK_VERSION` | `draft` or `published`. Use `draft` locally to see unpublished content. |
| `NUXT_OG_IMAGE_SECRET` | Any UUID. Used for signing OG image URLs. |
| `IS_SPA` | `true` / `false`. Toggles SPA mode. |

Ask an existing team member for the Storyblok token — don't commit it.

## How the site works

Almost everything is CMS-driven. There is a **single page file** — `app/pages/[...slug].vue` — that catches every route:

1. It calls `useStory()` with the current path to fetch the matching Storyblok story.
2. That story is handed to a template component (`TemplatePage` or `TemplateProject`) based on its type.
3. The template loops over `story.content.blocks` and renders a `Block*` component per block, matched on `block.component`.

So **adding a new content section means adding a `Block*` component and wiring it into the template** — not adding a route.

```
app/
  pages/[...slug].vue        # the only route — catches everything
  components/
    template/                # Page.vue, Project.vue — top-level story layouts
    block/                   # one component per Storyblok block (Hero, Team, Services…)
    storyblok/               # CMS primitives: Link, Text (rich text)
    ui/ card/ media/ …       # generic building blocks
  composables/               # useStory, useAtMedia, useAudio… (auto-imported)
  utils/                     # storyblok, breakpoints, theme… (auto-imported)
  stores/                    # Pinia
  assets/css/                # Tailwind entry + design tokens
  assets/icons/              # SVGs, imported as Vue components
server/api/                  # sitemap, weather
```

Nuxt auto-imports everything in `composables/`, `utils/`, and `components/` — **don't write explicit imports for them**.

## Storyblok

TypeScript types for every Storyblok component are **generated, not hand-written**. They live in `.storyblok/` and are imported via the `#storyblok-components` alias. That directory *is* committed, but never edit it by hand — it gets overwritten.

```bash
npm run sb:login       # once, to authenticate the CLI
npm run sb:generate    # pull components + regenerate types
```

`npm run dev` runs `sb:generate` automatically, so types stay current. If you change a block's schema in Storyblok, re-run dev (or `sb:generate`) to pick it up.

There's also an optional Storyblok MCP server for AI agents — copy `.mcp.json.example` to `.mcp.json` and add a personal access token.

## Styling

Tailwind v4, configured **CSS-first** in `app/assets/css/app.css`.

The default Tailwind palette, spacing, breakpoints and font scales are **reset to nothing**. Only tokens defined in the `@theme` block exist. If you need a value that isn't there, add it to `@theme` rather than reaching for an arbitrary value like `text-[13px]`.

- Spacing base is **4px** — `p-2` is 8px, `p-4` is 16px.
- Breakpoints: `2xs` 375, `xs` 480, `sm` 600, `md` 800, `lg` 1200, `xl` 1440, `2xl` 1800.
- Custom variants: `only-hover:` and `only-touch:`.
- Components use utility classes — there are no `<style scoped>` blocks, keep it that way.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Regenerate Storyblok types, then start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run generate` | Static build |
| `npm run sb:generate` | Pull Storyblok components and regenerate types |
| `npm run nuke` | Delete `node_modules`, lockfile and build output — the fix-it-all-else-failed button |

## Code style

Linting, type-checking and formatting go through **vite-plus** (`vp`) and **oxfmt**:

- No semicolons, single quotes, 120 char width
- One attribute per line in templates when there's more than one

Run `vp check` (or `vp check --fix`) before pushing. A staged-files hook is configured in `vite.config.ts`, but note the Husky `pre-commit` hook is currently empty, so **linting does not run automatically on commit** — only commitlint does, via `commit-msg`.

Commits follow [Conventional Commits](https://www.conventionalcommits.org). If the commit hook complains, fix the underlying issue rather than passing `--no-verify`.

## Conventions and agent docs

`AGENTS.md` is the single source of truth for coding conventions — `CLAUDE.md` and `GEMINI.md` are symlinks to it. **Read it before making changes**; it covers auto-imports, styling rules, Storyblok patterns and the Figma-to-code workflow in detail.

Supporting docs live in `docs/agents/`. Issues and PRDs are tracked as GitHub issues in `dittastudio/ditta` via the `gh` CLI.
