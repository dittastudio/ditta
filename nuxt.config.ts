import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'
import { breakpoints } from './app/utils/breakpoints'

// Workers Builds sets WORKERS_CI_BRANCH at build time only, and its build variables are shared by every branch, so
// the branch decides: `main` prerenders the live site, any other branch (`develop`) builds the Storyblok editor
// preview as an SPA. Locally, `NUXT_PRERENDER=false` does. At runtime, wrangler.jsonc's vars decide.
const ciBranch = process.env.WORKERS_CI_BRANCH
const isSpa = ciBranch ? ciBranch !== 'main' : process.env.NUXT_PRERENDER === 'false'
const isProduction = ciBranch === 'main'

export default defineNuxtConfig({
  // The e2e tests run their own dev server (playwright.config.ts), beside `npm run dev`, which locks .nuxt
  buildDir: process.env.NUXT_E2E ? '.nuxt-e2e' : undefined,
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@regle/nuxt',
    '@nuxtjs/seo',
    [
      '@nuxtjs/plausible',
      {
        domain: 'ditta.studio',
        autoOutboundTracking: true,
        fileDownloads: true,
        formSubmissions: true,
        ignoredHostnames: ['localhost', 'workers.dev'],
      },
    ],
    'lenis/nuxt',
    'nuxt-ai-ready',
    [
      '@nuxt/image',
      {
        provider: 'storyblok',
        storyblok: {
          baseURL: 'https://a2.storyblok.com',
          modifiers: {
            smart: true,
            format: 'webp',
          },
        },
        domains: ['storyblok.com', 'ditta.studio'],
        quality: 85,
        screens: breakpoints,
      },
    ],
    [
      '@storyblok/nuxt',
      {
        accessToken: process.env.NUXT_STORYBLOK_TOKEN,
      },
    ],
  ],
  app: {
    pageTransition: { name: 'fade', mode: 'out-in' },
    layoutTransition: false,
    head: {
      htmlAttrs: {
        lang: 'en-GB',
      },
      meta: [
        { name: 'author', content: 'ditta' },
        { name: 'msapplication-TileColor', content: '#ffa4d2' },
        { name: 'theme-color', content: '#ffa4d2' },
        { name: 'apple-mobile-web-app-title', content: 'ditta' },
        { 'http-equiv': 'content-language', content: 'en-GB' },
      ],
      link: [
        { rel: 'manifest', href: '/site.webmanifest' },
        {
          rel: 'preload',
          type: 'font/woff2',
          href: '/fonts/SaansVF.woff2',
          as: 'font',
          crossorigin: '',
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: !isProduction ? '/develop.svg' : '/favicon.svg',
        },
      ],
    },
  },
  routeRules: {
    '/**': {
      prerender: !isSpa,
    },
    // Per-visitor form state, nothing to prerender (docs/plans/brief-builder-milestones.md)
    // noindex as a response header as well as a meta tag, since the page is client-only and crawlers that don't
    // run JavaScript never see the tag. Remove this and the page's useSeoMeta robots at launch (M7).
    '/brief/**': {
      ssr: false,
      prerender: false,
      robots: false,
    },
    '/brief': {
      ssr: false,
      prerender: false,
      robots: false,
    },
  },
  nitro: {
    cloudflare: {
      deployConfig: true, // writes .output/server/wrangler.json for `wrangler deploy`
      nodeCompat: true, // merged with the root wrangler.jsonc
    },
    experimental: {
      wasm: true, // ...for Cloudflare Workers
      tasks: true,
    },
    // Bundled into the server for the brief PDF (server/pdf/brief.ts), which embeds the brand font and logo rather
    // than fetching them, so it renders the same wherever the brief was sent from (localhost included)
    serverAssets: [
      { baseName: 'fonts', dir: '../public/fonts' },
      { baseName: 'icons', dir: '../app/assets/icons' },
    ],
    // Cron triggers on the Worker (server/tasks). Each cron also has to be in wrangler.jsonc's triggers.
    scheduledTasks: {
      '0 * * * *': ['brief:sweep'],
    },
    prerender: {
      crawlLinks: !isSpa,
      routes: isSpa ? [] : ['/'],
      autoSubfolderIndex: false,
      ignore: [(route) => route.includes('?')],
    },
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('mux-'),
    },
  },
  compatibilityDate: '2025-07-15',
  experimental: {
    defaults: {
      // A link's page is fetched when it's hovered or focused, not as soon as it scrolls into view
      nuxtLink: { prefetchOn: { interaction: true, visibility: false } },
    },
  },
  hooks: {
    // Heavy chunks few visitors need, so not prefetched on every page. Mario's is fetched by code on the arrow's first poke,
    // the preview bridge is only for the editor, and the video player still preloads on the pages that render one.
    'build:manifest': (manifest) => {
      const notPrefetched = ['block/StepsMario.vue', 'ui/MuxVideo.vue', '@storyblok/preview-bridge/dist/esm/index.js']

      for (const chunk of Object.values(manifest)) {
        chunk.dynamicImports = chunk.dynamicImports?.filter(
          (path) => !notPrefetched.some((name) => path.endsWith(name)),
        )
      }
    },
  },
  // `nuxt dev` runs with wrangler's local bindings from wrangler.jsonc: the briefs' D1 (`.wrangler/state`) and the rate
  // limit. Apply migrations to it with `npx wrangler d1 migrations apply ditta-briefs --local`.
  $development: {
    nitro: {
      preset: 'cloudflare-dev',
    },
  },
  ssr: !isSpa,
  css: ['~/assets/css/app.css'],
  devtools: { enabled: false },
  runtimeConfig: {
    // The brief builder's submission (server/api/brief.post.ts). NUXT_RESEND_API_KEY and NUXT_TURNSTILE_SECRET_KEY
    // are Worker secrets; the addresses are set in wrangler.jsonc. These defaults are Resend's test addresses.
    resendApiKey: '',
    turnstileSecretKey: '',
    brief: {
      from: 'ditta briefs <onboarding@resend.dev>',
      to: 'delivered@resend.dev',
    },
    // Browser Run, which renders the confirmed brief's PDF (server/utils/briefPdf.ts). The account ID is set in
    // wrangler.jsonc; NUXT_CLOUDFLARE_BROWSER_TOKEN is a Worker secret ("Browser Run: Edit" on this account only).
    // Without them the emails go without the PDF.
    cloudflare: {
      accountId: '',
      browserToken: '',
    },
    // The Storyblok token lives in the module's `public.storyblok.accessToken`. On Cloudflare, runtime vars override
    // both at request time: NUXT_PUBLIC_STORYBLOK_ACCESS_TOKEN (the previews' secret) and NUXT_PUBLIC_STORYBLOK_VERSION.
    public: {
      STORYBLOK_VERSION: ciBranch ? (isSpa ? 'draft' : 'published') : process.env.NUXT_STORYBLOK_VERSION,
      // Set in wrangler.jsonc; empty in `nuxt dev`, which falls back to Turnstile's test key
      turnstileSiteKey: '',
    },
  },
  vite: {
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('mux-'),
        },
      },
    },
    optimizeDeps: {
      include: [
        '@mux/mux-video',
        '@plausible-analytics/tracker',
        '@storyblok/vue',
        '@tiptap/core',
        '@unhead/schema-org/vue',
        '@vueuse/core',
        '@web-kits/audio',
        'gsap',
        'gsap/ScrollTrigger',
        'gsap/SplitText',
        'lenis/vue',
        'matter-js',
      ],
    },
    plugins: [
      tailwindcss(),
      svgLoader({
        svgo: false,
      }),
    ],
  },
  alias: {
    '#storyblok-schema': fileURLToPath(new URL('./.storyblok/schema/schema', import.meta.url)),
  },
  postcss: {
    plugins: {
      'postcss-nested': {},
      'postcss-utopia': {
        minWidth: 375,
        maxWidth: 1800,
      },
    },
  },
  ogImage: {
    enabled: false,
  },
  seo: {
    automaticOgAndTwitterTags: false,
  },
  skewProtection: {
    enabled: false,
  },
  site: {
    name: 'ditta',
    url: 'https://ditta.studio',
  },
  sitemap: {
    excludeAppSources: true,
    sources: ['/api/sitemap'],
  },
})
