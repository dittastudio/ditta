import svgLoader from 'vite-svg-loader'

export default defineNuxtConfig({
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: {
        lang: 'en-GB',
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'author', content: 'ditta' },
        { name: 'revisit-after', content: '1 day' },
        { name: 'msapplication-TileColor', content: '#ffb9b9' },
        { name: 'theme-color', content: '#ffb9b9' },
        { name: 'google', content: 'notranslate' },
        { 'http-equiv': 'content-language', content: 'en-GB' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://a2.storyblok.com' },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: false,
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
  ssr: process.env.NUXT_SSR === 'true' ? true : false,
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
