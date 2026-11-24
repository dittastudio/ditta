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
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
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
  },
  nitro: {
    cloudflare: {
      deployConfig: true, // writes .output/server/wrangler.json for `wrangler deploy`
      nodeCompat: true, // merged with the root wrangler.jsonc
    },
    experimental: {
      wasm: true, // ...for Cloudflare Workers
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
  ssr: !isSpa,
  css: ['~/assets/css/app.css'],
  devtools: { enabled: false },
  runtimeConfig: {
    // The Storyblok token lives in the module's `public.storyblok.accessToken`. On Cloudflare, runtime vars override
    // both at request time: NUXT_PUBLIC_STORYBLOK_ACCESS_TOKEN (the previews' secret) and NUXT_PUBLIC_STORYBLOK_VERSION.
    public: {
      STORYBLOK_VERSION: ciBranch ? (isSpa ? 'draft' : 'published') : process.env.NUXT_STORYBLOK_VERSION,
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
