import { defineConfig, devices } from '@playwright/test'

// End-to-end tests for the brief builder: `npm run test:e2e`. Local only for now. They run their own `nuxt dev` on
// port 3100, beside `npm run dev` (its own build dir, see nuxt.config.ts), with the local D1, Turnstile's always-pass
// keys, and no Resend key or Browser Run token: emails land in the dev outbox (server/routes/_dev/outbox.get.ts), and
// there's no PDF. Real delivery, the PDF and the real Turnstile stay checks on the preview.
const PORT = 3100

export default defineConfig({
  testDir: 'tests/e2e',
  // Each test has its own email and IP, so they can run side by side
  fullyParallel: true,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The local D1 brought up to date first
    command: `npx wrangler d1 migrations apply ditta-briefs --local && npx nuxt dev --port ${PORT}`,
    url: `http://localhost:${PORT}/brief`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      NUXT_E2E: '1',
      // Empty overrides .env, so nothing leaves the machine
      NUXT_RESEND_API_KEY: '',
      NUXT_CLOUDFLARE_BROWSER_TOKEN: '',
      NUXT_TURNSTILE_SECRET_KEY: '',
      NUXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      NUXT_BRIEF_TO: 'team@e2e.test',
    },
  },
})
