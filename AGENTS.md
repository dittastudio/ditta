# Project Rules

This file is the single source of truth for AI coding agents working on this repo. `CLAUDE.md`, `GEMINI.md`, and `.cursor/rules/viteplus.mdc` all symlink here.

## Stack

- **Nuxt 4** in app directory mode (`app/`)
- **Vue 3** with `<script lang="ts" setup>` SFCs
- **TypeScript** throughout
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (CSS-first, `@theme` block)
- **Storyblok** as the headless CMS via `@storyblok/nuxt`
- **@nuxt/image** with the Storyblok provider for image optimization
- **vite-svg-loader** for importing SVGs as Vue components
- **vite-plus** (`vp`) for linting + type-checking; **oxfmt** for formatting

## Project Structure

```
app/
  app.vue                    # Root layout
  assets/
    css/                     # Global styles — see Styling section
    icons/                   # SVG icons imported as Vue components
  components/
    storyblok/               # One Vue component per Storyblok block (PascalCase, named after the block)
  composables/               # Auto-imported, e.g. useStory, useAtMedia
  pages/                     # File-based routing
  storyblok/                 # (placeholder)
  types/                     # Project-level TS type declarations
  utils/                     # Auto-imported helpers (storyblok.ts, screens.ts, helpers.ts)
.storyblok/                  # GENERATED — do not edit
  types/284609/storyblok-components.d.ts
public/
  fonts/                     # Static fonts referenced from CSS
nuxt.config.ts
vite.config.ts               # vite-plus config (lint + format + staged hooks)
.oxfmtrc.json                # oxfmt formatter config
```

Path aliases (configured in `nuxt.config.ts`):

- `@/` → `app/`
- `~/` → project root
- `#storyblok-components` → generated Storyblok component types
- `#storyblok-types` → generated Storyblok shared types

## Auto-imports — Do Not Manually Import

Nuxt auto-imports the following. **Never add explicit imports** for them — it produces lint errors and noise.

- Vue runtime: `ref`, `computed`, `reactive`, `watch`, `watchEffect`, `onMounted`, `onUnmounted`, `nextTick`, `h`, `defineProps`, `defineEmits`, `defineModel`, etc.
- Nuxt: `useRoute`, `useRouter`, `useHead`, `useSeoMeta`, `useRuntimeConfig`, `useAsyncData`, `useFetch`, `navigateTo`, `createError`, `definePageMeta`, etc.
- Project composables under `app/composables/` (e.g. `useStory`, `useAtMedia`)
- Project utils under `app/utils/` (e.g. `storyblokSlug`, `storyblokImage`, `storyblokEditor`, `getMediaQuery`, `wait`)
- Components under `app/components/` (resolved by Nuxt's components system)
- Storyblok composables: `useAsyncStoryblok`, `useStoryblokRichText`

**Always import** types, third-party libraries, and SVG files. Use `import type` for type-only imports.

## Styling — Tailwind CSS v4 + Custom `@theme`

All design tokens live in `app/assets/css/app.css` inside the `@theme` block. The CSS cascade is:

```
app/assets/css/app.css       # Tailwind import + @theme tokens (entry)
  ├ fonts.css                # @font-face declarations (@layer base)
  ├ resets.css               # Element resets (@layer base)
  ├ transitions.css          # Vue transition classes (@layer base)
  ├ utils.css                # @custom-variant declarations
  └ page.css                 # Document-level theming (@layer theme)
```

### Core Rules

- **IMPORTANT: Never hardcode colors, spacing, breakpoints, font sizes, easings, or fonts.** Use the tokens defined in `@theme` (e.g. `bg-black`, `text-16`, `font-sans`, `ease-outCubic`, `md:flex`).
- **The default Tailwind palette and breakpoint scale are reset** (`--color-\*: initial`, `--breakpoint-\*: initial`, `--spacing-\*: initial`, `--font-\*: initial`, `--text-\*: initial`). Only tokens explicitly defined in `@theme` exist. If a design needs a value that does not exist as a token, **add it to `@theme` first** rather than using a one-off arbitrary value.
- **Spacing base is 4px** (`--spacing: 4px`). Tailwind spacing utilities (`p-2`, `gap-4`, etc.) multiply this base — `p-2` = 8px, `p-4` = 16px.
- **Breakpoints** are `2xs` (375px), `xs` (480px), `sm` (600px), `md` (800px), `lg` (1200px), `xl` (1440px), `2xl` (1800px). They mirror the `@nuxt/image` `screens` config in `nuxt.config.ts` — keep both in sync.
- **Custom variants** available: `only-hover:` (hover-capable devices), `only-touch:` (touch devices). Defined in `app/assets/css/utils.css`.
- **Easings** are exposed as Tailwind `ease-*` utilities and as CSS variables (`var(--ease-outCubic)`, etc.). Use them for transitions.
- **Prefer utility classes in templates** over `<style>` blocks. Vue SFCs in this repo do not use `<style scoped>` — keep that convention. Add to global CSS files only when a utility composition would be unreasonable (e.g. selection styles, complex transitions, `@font-face`).
- When writing custom CSS, place it in the appropriate layer (`@layer base` for resets/element styling, `@layer theme` for document-level theming) and use `var(--token)` references.
- Use `--alpha(var(--color-x) / N%)` for alpha blending of theme colors (see `resets.css` for an example).

## Vue SFC Conventions

- Order: `<script lang="ts" setup>` first, then `<template>`. No `<style>` block by default.
- Props via `interface Props { ... }` + `defineProps<Props>()` with destructuring:
  ```vue
  interface Props { item: StoryblokMultilink }
  const { item } = defineProps<Props>()
  ```
- Use `import type` for type-only imports — separate from value imports.
- Use `NuxtLink` for internal navigation; the project's `Link.vue` Storyblok block wraps it for CMS multilinks.
- Keep components small and composable. Storyblok block components live in `app/components/storyblok/` and are named after the Storyblok component (PascalCase).

## Icons

- SVG files live in `app/assets/icons/`.
- Import them as Vue components:
  ```ts
  import IconLogo from '@/assets/icons/ditta.svg'
  ```
- Style with utility classes (`class="h-6 w-auto"`). Color via `currentcolor` — `svg { fill: currentcolor }` is set globally in `resets.css`, so `text-black` on the parent colors the icon.
- **IMPORTANT: Do not install icon packages** (lucide, heroicons, etc.). All icons should be SVGs added to `app/assets/icons/`.
- File naming: `kebab-case.svg`. Component naming on import: `IconPascalCase`.

## Images

- Use `<NuxtImg>` from `@nuxt/image` for all CMS images. Provider is Storyblok (configured in `nuxt.config.ts`).
- For programmatic image URLs (meta tags, OG images), use the `storyblokImage(filename, modifiers)` helper from `app/utils/storyblok.ts`.
- For original Storyblok image dimensions, use `storyblokImageDimensions(filename)`.
- Format defaults to `webp`, quality 85; override per-call via modifiers when needed.
- Local static assets that are not CMS-managed go in `public/` (e.g. `public/fonts/`).

## Storyblok Integration

- Use `useStory<T>(slug, api?, bridge?, options?)` from `app/composables/useStory.ts` to fetch stories. It handles draft/published, release previews, and 404s.
- Story types come from `#storyblok-components` (e.g. `Page`, `Settings`). Never hand-author these — they are regenerated by `npm run sb:generate`.
- Rich text rendering goes through `useStoryblokRichText` — see `app/components/storyblok/Text.vue` for the canonical pattern (with custom Tiptap mark for links).
- Multilinks (`StoryblokMultilink`) should be rendered through the existing `Link.vue` component, which normalizes `story` / `email` / `url` link types and wraps `NuxtLink`.
- Use `storyblokSlug(path)` to normalize paths (`/` → `/home`, strips trailing slash). Use `storyblokEditor(route.query)` to detect when running inside Storyblok's visual editor.
- Use `isPage(story)` (and similar guards) for type narrowing on stories.
- The 284609 space ID is wired into the `sb:components` and `sb:types` scripts. Don't change it without coordination.

## Linting & Formatting

- **Lint:** `vp check` (vite-plus, oxc-based, with type-aware rules). Run via the staged hook on commit.
- **Format:** oxfmt — config in `.oxfmtrc.json`. Key rules:
  - **No semicolons** (`semi: false`)
  - **Single quotes** (`singleQuote: true`)
  - **One attribute per line** in templates (`singleAttributePerLine: true`) when there are multiple attributes
  - Print width 120
- Don't manually run `--no-verify` to skip the staged hook. Fix the underlying lint/format error.

## Figma MCP Integration Rules

These rules govern every Figma-driven implementation in this repo.

### Required Flow (do not skip)

1. **Get the design context.** Call `get_design_context` with the `nodeId` and `fileKey` from the Figma URL.
2. **If the response is too large or truncated**, call `get_metadata` for the high-level node map, then re-fetch only the required node(s) with `get_design_context`.
3. **Get a screenshot.** Call `get_screenshot` for visual reference of the exact node/variant being built.
4. **Only after both context and screenshot**, download any required assets and start implementation.
5. **Translate, don't paste.** The MCP returns React + Tailwind as a reference. This project is **Vue 3 + Nuxt 4 + Tailwind v4** — adapt accordingly:
   - React JSX → Vue SFC `<script lang="ts" setup>` + `<template>`
   - `className` → `class`
   - React event props (`onClick`) → Vue event bindings (`@click`)
   - `useState` / `useEffect` → `ref` / `computed` / `watch` (auto-imported)
   - Inline `style={{}}` → utility classes when possible; CSS variables otherwise
6. **Map tokens.** Replace any hex colors, raw px values, or arbitrary Tailwind utilities (`[#fff]`, `[16px]`) with tokens from `@theme` in `app/assets/css/app.css`. If a needed token is missing, **add it to `@theme` first**.
7. **Reuse existing components.** Check `app/components/` (especially `storyblok/Link.vue`, `storyblok/Text.vue`) before creating new ones.
8. **Validate.** Compare the rendered output against the Figma screenshot for visual parity before marking complete.

### Asset Handling

- **IMPORTANT: If the Figma MCP returns a `localhost` source for an image or SVG, use that source directly** — do not substitute placeholders or alternate URLs.
- **IMPORTANT: Do not install or import new icon packages.** SVGs from Figma payloads should be saved to `app/assets/icons/` and imported via `vite-svg-loader`.
- Save downloaded raster assets that are not CMS-managed to `public/`. CMS-managed images come from Storyblok, not Figma — coordinate before adding new static images.

### Project-Specific Conventions for Figma Output

- Output goes into `app/components/` for generic components, `app/components/storyblok/` for new Storyblok block components (named after the block).
- Use `NuxtLink` (or the existing `Link.vue` for CMS multilinks) for navigation, never raw `<a>` for internal routes.
- Use `<NuxtImg>` for image rendering when the source is a CMS image.
- For breakpoints, use the project's scale (`2xs xs sm md lg xl 2xl`) — do not introduce new breakpoint names.
- For responsive media queries in JS, use `useAtMedia(getMediaQuery('md'))` (both auto-imported).
- Do not add `<style scoped>` blocks unless utility classes are genuinely insufficient.

## Quick Reference

| Task                            | Where / How                                                          |
| ------------------------------- | -------------------------------------------------------------------- |
| Add a design token              | `app/assets/css/app.css` → `@theme { ... }`                          |
| Add an SVG icon                 | Drop in `app/assets/icons/`, import as `@/assets/icons/foo.svg`      |
| Add a global utility class      | `app/assets/css/utils.css` (custom variants) or appropriate `@layer` |
| Add a Storyblok block component | `app/components/storyblok/<BlockName>.vue`                           |
| Add a route                     | `app/pages/...` (file-based)                                         |
| Add a composable                | `app/composables/use<Name>.ts` (auto-imported)                       |
| Regenerate Storyblok types      | `npm run sb:generate`                                                |
| Run dev server                  | `npm run dev`                                                        |
