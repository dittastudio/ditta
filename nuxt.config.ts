import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'
import { breakpoints } from './app/utils/breakpoints'

const isProduction =
  process.env.CONTEXT === 'production' || // Netlify
  process.env.CF_PAGES_BRANCH === 'main' || // Cloudflare Pages
  process.env.WORKERS_CI_BRANCH === 'main' // Cloudflare Workers (Builds)

const isSpa = process.env.IS_SPA === 'true'

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
        ignoredHostnames: ['localhost', 'netlify.app', 'vercel.app'],
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
        quality: 90,
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
        { rel: 'preload', type: 'font/woff2', href: '/fonts/SaansVF.woff2', as: 'font', crossorigin: '' },
        { rel: 'preload', type: 'font/woff2', href: '/fonts/JetBrainsMonoVF.woff2', as: 'font', crossorigin: '' },
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
  hooks: {
    'build:manifest': (manifest) => {
      // Heavy chunks few visitors need, so not prefetched on every page. Mario's is fetched by code on the arrow's first
      // poke, the video player's once a video is on its way, and the preview bridge is only for the editor.
      const notPrefetched = ['block/StepsMario.vue', 'ui/MuxVideo.vue', '@storyblok/preview-bridge/dist/esm/index.js']

      // Only what the first screen runs on is preloaded. Nuxt would preload every block a page renders, including those
      // that wait to hydrate, so they'd compete with the first screen for code that isn't needed yet.
      const isFirstScreen = (key: string) =>
        /(entry\.js|pages\/.*|template\/\w+\.vue|block\/Hero(Project)?\.vue)$/.test(key)

      const closure = (key: string, seen = new Set<string>()) => {
        if (!seen.has(key) && manifest[key]) {
          seen.add(key)
          manifest[key].imports?.forEach((dep) => closure(dep, seen))
        }

        return seen
      }

      const deferred = Object.keys(manifest).filter((key) => !isFirstScreen(key) && key.endsWith('.vue'))
      const stylesheets = new Map(
        deferred.map((key) => [key, [...closure(key)].flatMap((dep) => manifest[dep]?.css ?? [])]),
      )

      for (const [key, chunk] of Object.entries(manifest)) {
        chunk.dynamicImports = chunk.dynamicImports?.filter(
          (path) => !notPrefetched.some((name) => path.endsWith(name)),
        )

        // Imports here only tell the renderer what to preload. The browser still follows the chunk's own at runtime.
        if (stylesheets.has(key)) {
          chunk.preload = false
          chunk.css = [...new Set(stylesheets.get(key))]
          chunk.imports = []
        }
      }
    },
  },
  ssr: !isSpa,
  css: ['~/assets/css/app.css'],
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      STORYBLOK_TOKEN: process.env.NUXT_STORYBLOK_TOKEN,
      STORYBLOK_VERSION: process.env.NUXT_STORYBLOK_VERSION,
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
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vueuse/core',
        '@web-kits/audio',
        'gsap',
        'gsap/ScrollTrigger',
        'gsap/SplitText',
        'lenis/vue',
        'matter-js',
        'tailwind-merge',
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
