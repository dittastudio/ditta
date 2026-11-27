import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

// `npm test`: plain logic in Node (test/unit), and what needs Nuxt (stores, composables) in its environment
// (test/nuxt). The e2e tests are Playwright's (npm run test:e2e). Apart from vite.config.ts, since the Nuxt project
// boots Nuxt to load, which `vp check` has no need of.
export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: { '#shared': fileURLToPath(new URL('./shared', import.meta.url)) },
        },
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.test.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              domEnvironment: 'happy-dom',
              overrides: {
                buildDir: '.nuxt-vitest',
              },
            },
          },
        },
      }),
    ],
  },
})
