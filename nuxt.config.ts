import svgLoader from 'vite-svg-loader'

export default defineNuxtConfig({
  devtools: { enabled: true },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: false,
    head: {
      htmlAttrs: {
        lang: 'en-GB',
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'author', content: 'ditta' },
        { name: 'revisit-after', content: '1 day' },
        { name: 'msapplication-TileColor', content: '#ffa4d2' },
        { name: 'theme-color', content: '#ffa4d2' },
        { name: 'apple-mobile-web-app-title', content: 'ditta' },
        { name: 'google', content: 'notranslate' },
        { 'http-equiv': 'content-language', 'content': 'en-GB' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://a2.storyblok.com' },
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
  css: process.env.LOCAL === 'true' ? ['@michaelpumo/screen/app.css'] : [],
  build: {
    transpile: ['gsap'],
  },
  eslint: {
    config: {
      standalone: false,
      stylistic: true,
    },
  },
  gtag: {
    id: 'G-VPGVW7ZKGD',
  },
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/sitemap',
    '@nuxtjs/tailwindcss',
    '@storyblok/nuxt',
    'nuxt-gtag',
  ],
  storyblok: {
    accessToken: process.env.NUXT_STORYBLOK_TOKEN,
  },
  postcss: {
    plugins: {
      'tailwindcss/nesting': {},
      'tailwindcss': {},
      'postcss-utopia': {
        minWidth: 375,
        maxWidth: 1440,
      },
    },
  },
  runtimeConfig: {
    private: {},
    public: {
      SSR: process.env.NUXT_SSR,
      STORYBLOK_TOKEN: process.env.NUXT_STORYBLOK_TOKEN,
      STORYBLOK_VERSION: process.env.NUXT_STORYBLOK_VERSION,
    },
  },
  site: {
    url: 'https://ditta.studio',
  },
  ssr: process.env.NUXT_SSR === 'true',
  tailwindcss: {
    cssPath: '@/assets/css/app.css',
  },
  typescript: {
    strict: true,
  },
  vite: {
    plugins: [
      svgLoader({
        svgo: false,
      }),
    ],
    vue: {
      script: {
        defineModel: true,
        propsDestructure: true,
      },
    },
  },
})
