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

| Variable                 | Purpose                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- |
| `NUXT_STORYBLOK_TOKEN`   | Storyblok content delivery API token. **Required** — nothing renders without it. |
| `NUXT_STORYBLOK_VERSION` | `draft` or `published`. Use `draft` locally to see unpublished content.          |
| `NUXT_OG_IMAGE_SECRET`   | Any UUID. Used for signing OG image URLs.                                        |
| `IS_SPA`                 | `true` / `false`. Toggles SPA mode.                                              |

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
.storyblok/schema/           # the Storyblok schema, in TypeScript — see below
```

Nuxt auto-imports everything in `composables/`, `utils/`, and `components/` — **don't write explicit imports for them**.

## Storyblok

The schema is **code-first**. Every block, datasource and folder is defined in TypeScript under `.storyblok/schema/`, and that directory is the source of truth — the Storyblok space is updated from it, not the other way round.

Types are inferred from those definitions, so there is no codegen step. Type a component's props by block name:

```ts
import type { Block } from '#storyblok-schema'

interface Props {
  block: Block<'block_accordion'>
}
```

Nested blocks and field types resolve from the same definitions, so `block.items` inside an accordion is typed as the element blocks its schema allows, with no casting.

Two things the types can't infer on their own:

- **Optional fields are `T | null | undefined`.** The CDN sends `null` for a field the editor left empty, so a prop receiving one declares `| null` rather than coercing at the call site.
- **Relation fields are typed as UUID strings**, because that is what the API returns without `resolve_relations`. Read them through `storyblokRelations<'project'>(block.projects)`, which widens to the resolved stories and drops anything the CDN left unresolved.

To change a block, edit its file under `.storyblok/schema/` and push. Changing it in the Storyblok UI instead will drift from these files and won't reach the app's types.

```bash
npm run sb:login             # once, to authenticate the CLI
npm run sb:schema-validate   # offline — no login, no API calls
npm run sb:schema-diff       # show what a push would change, applying nothing
npm run sb:schema-push       # push local schema to the space
```

Run the diff first — a push writes to the live space, and it only creates and updates: a block deleted locally survives remotely until someone passes `--delete`.

Every push saves a changeset to `.storyblok/schema/changesets/` capturing the pre-push state; `npm run sb:schema-rollback` replays one to undo a push, so those files are worth committing.

(`sb:schema-init`, which bootstrapped `.storyblok/schema/` from the space, is a one-time command that **overwrites** that directory. It has already been run — don't run it again without coordination.)

### Content migrations

A schema push changes the _shape_ of a block. It does not touch content already saved in existing stories — rename a field and every published story still holds its value under the old key. Moving that content is a separate step:

```bash
npm run sb:migrations-generate -- block_text   # scaffold a migration for one block
npm run sb:migrations-dry -- block_text        # preview against real stories, writing nothing
npm run sb:migrations-run -- block_text        # apply it
```

Migrations live in `.storyblok/migrations/284609/` and are plain JS modules that transform a block's content. A push offers to scaffold them for breaking changes, but the scaffolds are starting points — read them before running. Each run snapshots content first, so `npm run sb:migrations-rollback` can undo it.

Runs save as draft; pass `--publish published` to republish stories that were already live.

There's also an optional Storyblok MCP server for AI agents — copy `.mcp.json.example` to `.mcp.json` and add a personal access token.

## Styling

Tailwind v4, configured **CSS-first** in `app/assets/css/app.css`.

The default Tailwind palette, spacing, breakpoints and font scales are **reset to nothing**. Only tokens defined in the `@theme` block exist. If you need a value that isn't there, add it to `@theme` rather than reaching for an arbitrary value like `text-[13px]`.

- Spacing base is **4px** — `p-2` is 8px, `p-4` is 16px.
- Breakpoints: `2xs` 375, `xs` 480, `sm` 600, `md` 800, `lg` 1200, `xl` 1440, `2xl` 1800.
- Custom variants: `only-hover:` and `only-touch:`.
- Components use utility classes — there are no `<style scoped>` blocks, keep it that way.

## Scripts

| Command                          | What it does                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`                    | Start the dev server                                                                 |
| `npm run build`                  | Production build                                                                     |
| `npm run preview`                | Preview the production build locally                                                 |
| `npm run generate`               | Static build                                                                         |
| `npm run sb:schema-validate`     | Validate the local Storyblok schema, offline                                         |
| `npm run sb:schema-diff`         | Show what a schema push would change, without applying it                            |
| `npm run sb:schema-push`         | Push the local Storyblok schema to the space                                         |
| `npm run sb:schema-rollback`     | Roll the space back to a saved changeset                                             |
| `npm run sb:migrations-generate` | Scaffold a content migration for a block                                             |
| `npm run sb:migrations-dry`      | Preview a content migration without applying it                                      |
| `npm run sb:migrations-run`      | Apply a content migration to existing stories                                        |
| `npm run sb:migrations-rollback` | Undo a content migration from its snapshot                                           |
| `npm run nuke`                   | Delete `node_modules`, lockfile and build output — the fix-it-all-else-failed button |

## Code style

Linting and formatting go through **vite-plus** (`vp`) and **oxfmt**:

- No semicolons, single quotes, 120 char width
- One attribute per line in templates when there's more than one

Run `vp check` (or `vp check --fix`) before pushing. A staged-files hook is configured in `vite.config.ts`, but note the Husky `pre-commit` hook is currently empty, so **linting does not run automatically on commit** — only commitlint does, via `commit-msg`.

### Type checking

`vp check` type-checks `.ts` files, but **not the `<template>` half of a `.vue` file**. A type error in a template — the wrong prop type passed to a component, a null reaching a prop that doesn't accept one — will pass `vp check` and still break the build's type contract. Your editor's Vue plugin catches these; the terminal does not.

No type checker is installed, so `nuxt typecheck` will not run as-is. To check templates across the whole project, run one through npx:

```bash
npx -y -p typescript@5.9 -p vue-tsc@2.2 vue-tsc --noEmit -p .nuxt/tsconfig.app.json
```

The pinned versions matter: `vue-tsc` cannot load the TypeScript 7 that this repo installs, so it needs its own TypeScript 5 alongside it.

There are currently **10 known errors** from this command, all pre-existing and unrelated to Storyblok — `useTemplateRef` inferring a single element instead of an array (`Projects.vue`, `Steps.vue`, `Ticker.vue`), a `DevGuide` prop, and a missing `defineSitemapEventHandler` export in `server/api/sitemap.ts`. Treat that as the baseline: new work shouldn't add to it.

Commits follow [Conventional Commits](https://www.conventionalcommits.org). If the commit hook complains, fix the underlying issue rather than passing `--no-verify`.

## Conventions and agent docs

`AGENTS.md` is the single source of truth for coding conventions — `CLAUDE.md` and `GEMINI.md` are symlinks to it. **Read it before making changes**; it covers auto-imports, styling rules, Storyblok patterns and the Figma-to-code workflow in detail.

Supporting docs live in `docs/agents/`. Issues and PRDs are tracked as GitHub issues in `dittastudio/ditta` via the `gh` CLI.
