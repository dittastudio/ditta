import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/image', ['@storyblok/nuxt', { accessToken: process.env.NUXT_STORYBLOK_TOKEN }]],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit'],
    },
    plugins: [
      tailwindcss(),
      svgLoader({
        svgo: false,
      }),
    ],
  },
  alias: {
    '#storyblok-components': fileURLToPath(
      new URL('./.storyblok/types/284609/storyblok-components', import.meta.url),
    ),
    '#storyblok-types': fileURLToPath(new URL('./.storyblok/types/storyblok', import.meta.url)),
  },
})
