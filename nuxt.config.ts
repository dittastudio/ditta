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
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
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
    '#storyblok-components': fileURLToPath(new URL('./.storyblok/types/284609/storyblok-components', import.meta.url)),
    '#storyblok-types': fileURLToPath(new URL('./.storyblok/types/storyblok', import.meta.url)),
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
  site: {
    name: 'ditta',
    url: 'https://ditta.studio',
  },
  sitemap: {
    excludeAppSources: true,
    sources: ['/api/sitemap'],
  },
})
