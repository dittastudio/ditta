import type { Themes } from '@/types/app'

declare module '#app' {
  interface PageMeta {
    /** false leaves out the site's tagline (app.vue), for a page with its own heading up top */
    tagline?: boolean
    /** The page's theme, set on the server (app.vue) so the first paint is already in it */
    theme?: Themes
  }
}

export {}
