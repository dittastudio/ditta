declare module '#app' {
  interface PageMeta {
    /** false leaves out the site's tagline (app.vue), for a page with its own heading up top */
    tagline?: boolean
  }
}

export {}
