import { fileURLToPath } from 'node:url'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'
import { defineConfig, devices } from '@playwright/test'
import { RESEND_WAIT_MS } from './test/e2e/settings'

// End-to-end tests for the brief builder: `npm run test:e2e`, and in CI (.github/workflows/check.yml). They run their own `nuxt dev` on
// port 3100, beside `npm run dev` (its own build dir, see nuxt.config.ts), with the local D1, Turnstile's always-pass
// keys, and no Resend key or Browser Run token: emails land in the dev outbox (server/dev/outbox.ts), and
// there's no PDF. Real delivery, the PDF and the real Turnstile stay checks on the preview.
const PORT = 3100
const HOST = `http://localhost:${PORT}`

export default defineConfig<ConfigOptions>({
  testDir: 'test/e2e',
  // Each test has its own email and IP, so they can run side by side
  fullyParallel: true,
  timeout: 60_000,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  // In CI a test gets one more go, so a flaky run doesn't block a merge, and its trace shows what went wrong
  retries: process.env.CI ? 1 : 0,
  use: {
    // Nuxt's fixture (@nuxt/test-utils/playwright) is pointed at the one dev server below rather than building and
    // serving the app itself: its servers are one per worker, and the app only runs against wrangler's local
    // bindings under `nuxt dev` (the cloudflare-dev preset)
    nuxt: {
      rootDir: fileURLToPath(new URL('.', import.meta.url)),
      host: HOST,
    },
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The local D1 brought up to date first
    command: `npx wrangler d1 migrations apply ditta-briefs --local && npx nuxt dev --port ${PORT}`,
    url: `${HOST}/brief`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NUXT_E2E: '1',
      // Empty overrides .env, so nothing leaves the machine
      NUXT_RESEND_API_KEY: '',
      NUXT_CLOUDFLARE_BROWSER_TOKEN: '',
      NUXT_TURNSTILE_SECRET_KEY: '',
      NUXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      NUXT_BRIEF_TO: 'team@e2e.test',
      // The wait between sends, 20 seconds for real, so the tests of it don't sit through it
      NUXT_PUBLIC_BRIEF_RESEND_COOLDOWN_MS: String(RESEND_WAIT_MS),
    },
  },
})
