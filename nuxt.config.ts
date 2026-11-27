import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'
import { breakpoints } from './app/utils/breakpoints'

// `main` prerenders the live site; other branches build the Storyblok editor preview as an SPA
const ciBranch = process.env.WORKERS_CI_BRANCH
const isSpa = ciBranch ? ciBranch !== 'main' : process.env.NUXT_PRERENDER === 'false'
const isProduction = ciBranch === 'main'

// Public config the client can't work without. Prerendered pages carry the build's copy, so a build missing one
// fails rather than deploying a page that can't use it.
const requiredPublicConfig = ['turnstileSiteKey']

export default defineNuxtConfig({
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
    '/brief/confirm': {
      ssr: false,
      prerender: false,
      robots: false,
    },
  },
  nitro: {
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    // The Worker's bindings (see cloudflare.d.ts). The app's tsconfig takes them in as root .d.ts files already.
    typescript: {
      tsConfig: {
        include: ['../worker-configuration.d.ts', '../cloudflare.d.ts'],
      },
    },
    experimental: {
      wasm: true,
      tasks: true,
    },
    serverAssets: [
      { baseName: 'fonts', dir: '../public/fonts' },
      { baseName: 'icons', dir: '../app/assets/icons' },
    ],
    // Each cron also has to be in wrangler.jsonc's triggers
    scheduledTasks: {
      '*/15 * * * *': ['brief:sweep'],
    },
    prerender: {
      crawlLinks: !isSpa,
      routes: isSpa ? [] : ['/', '/brief'],
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
      nuxtLink: { prefetchOn: { interaction: true, visibility: false } },
    },
  },
  hooks: {
    'build:manifest': (manifest) => {
      const notPrefetched = ['block/StepsMario.vue', 'ui/MuxVideo.vue', '@storyblok/preview-bridge/dist/esm/index.js']

      for (const chunk of Object.values(manifest)) {
        chunk.dynamicImports = chunk.dynamicImports?.filter(
          (path) => !notPrefetched.some((name) => path.endsWith(name)),
        )
      }
    },
  },
  $development: {
    nitro: {
      preset: 'cloudflare-dev',
    },
    // Brief tools for designing the PDF and running through the flow, kept out of production builds altogether
    serverHandlers: [
      { route: '/_dev/outbox', method: 'get', handler: '~~/server/dev/outbox.ts' },
      { route: '/_dev/brief-pdf', method: 'get', handler: '~~/server/dev/brief-pdf.ts' },
      { route: '/_dev/brief/confirm', method: 'get', handler: '~~/server/dev/brief-confirm.ts' },
    ],
    // Empty, so `nuxt dev` uses Cloudflare's always-pass test key (app/components/brief/Turnstile.vue)
    runtimeConfig: {
      public: {
        turnstileSiteKey: '',
      },
    },
  },
  $production: {
    hooks: {
      ready: (nuxt) => {
        nuxt.hook('build:before', () => {
          const config = nuxt.options.runtimeConfig.public
          const missing = requiredPublicConfig.filter((key) => !config[key])
          if (missing.length) throw new Error(`Missing public runtime config: ${missing.join(', ')}`)
        })
      },
      'pages:extend': (pages) => {
        const previews = pages.filter((page) => page.file?.includes('/pages/_dev/'))
        for (const page of previews) pages.splice(pages.indexOf(page), 1)
      },
    },
  },
  ssr: !isSpa,
  typescript: {
    tsConfig: {
      include: ['../test/nuxt/**/*'],
    },
    sharedTsConfig: {
      include: ['../test/unit/**/*'],
    },
    nodeTsConfig: {
      include: ['../test/e2e/**/*', '../playwright.config.ts', '../vitest.config.ts'],
    },
  },
  css: ['~/assets/css/app.css'],
  devtools: { enabled: false },
  runtimeConfig: {
    resendApiKey: '',
    turnstileSecretKey: '',
    brief: {
      from: 'ditta briefs <onboarding@resend.dev>',
      to: 'delivered@resend.dev',
    },
    cloudflare: {
      accountId: '',
      browserToken: '',
    },
    public: {
      STORYBLOK_VERSION: ciBranch ? (isSpa ? 'draft' : 'published') : process.env.NUXT_STORYBLOK_VERSION,
      // Public by design, and set here rather than as a Worker var: prerendered pages carry the build's public config,
      // so a runtime var never reaches the client. The dashboard's hostname list is what keeps it to this site.
      turnstileSiteKey: '0x4AAAAAAGQ0b2civA5o_kxC',
      brief: {
        // The least time between two emails for one brief: the server refuses a send sooner, and Check your inbox
        // counts it down. Set only here, never as a Worker var: the client's copy is the build's (see above), so a
        // runtime var would leave the countdown and the server disagreeing. The e2e tests shorten it under `nuxt dev`.
        resendCooldownMs: 20_000,
      },
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
