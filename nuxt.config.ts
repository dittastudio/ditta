import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

export default defineNuxtConfig({
  modules: [
    [
      '@nuxt/image',
      {
        provider: 'storyblok',
        storyblok: {
          baseURL: 'https://a2.storyblok.com',
          modifiers: {
            smart: true,
          },
        },
        format: ['webp'],
        domains: ['storyblok.com', 'ditta.studio'],
        quality: 85,
        screens: {
          '2xs': 375,
          xs: 480,
          sm: 600,
          md: 800,
          lg: 1200,
          xl: 1440,
          '2xl': 1800,
        },
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
      ],
    },
  },
  compatibilityDate: '2025-07-15',
  ssr: true,
  devtools: { enabled: false },
  css: ['~/assets/css/app.css'],
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@storyblok/vue',
        '@tiptap/core',
        'gsap/SplitText',
        'lenis/vue',
        'gsap',
        'gsap/ScrollTrigger',
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
})
