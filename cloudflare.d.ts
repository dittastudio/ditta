// The Worker's bindings, for the server and for the app's typed $fetch, which reads the server routes' types.
// `Env` is generated from wrangler.jsonc (`npm run cf:types`, worker-configuration.d.ts) and names the bindings' types
// as globals. They're brought in here from @cloudflare/workers-types' importable form rather than as Workers' own
// runtime types, which would replace the DOM's globals (Element, Response) across the app.
import type * as Workers from '@cloudflare/workers-types'

declare global {
  type D1Database = Workers.D1Database
  type R2Bucket = Workers.R2Bucket
  type RateLimit = Workers.RateLimit

  // Set by Nitro's Cloudflare runtime for each request and scheduled event, and by its dev proxy in `nuxt dev`
  var __env__: Partial<Env> | undefined
}

// What Nitro's Cloudflare presets put on each request. Partial, since a binding can be missing where it isn't set up
// (the rate limit on branch previews, R2 before the bucket exists), and the code checks for each.
declare module 'h3' {
  interface H3EventContext {
    cloudflare?: { env: Partial<Env>; context: Workers.ExecutionContext }
  }
}

export {}
