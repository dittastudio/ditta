import type { Page } from '@playwright/test'
import { expect, test } from '@nuxt/test-utils/playwright'
import { open, primary } from './helpers'

// /brief's intro comes from the `brief` story (app/pages/brief/index.vue). These stand in for Storyblok, so editing the
// real story's wording never breaks them.
const STORY = '**/v2/cdn/stories/brief?*'

// /brief is prerendered, so a visit, or a navigation to it, gets the story the page was built with, out of these mocks'
// reach. They test the browser fetching it, as the editor preview (an SPA) does: a click on a link to /brief from
// another page, with the prerendered payload kept back so the page asks Storyblok. The link is the one an email link
// that no longer works offers (/brief/confirm with no token), since it's in code rather than in Storyblok.
async function fetchInBrowser(page: Page) {
  await page.route('**/brief/_payload.json*', (route) => route.abort())
  await open(page, '/brief/confirm')
  await page.getByRole('link', { name: 'start a new brief' }).click()
  await expect(page).toHaveURL(/\/brief$/)
}

test('the intro shows the story’s wording', async ({ page }) => {
  await page.route(STORY, (route) =>
    route.fulfill({
      json: {
        story: {
          id: 1,
          name: 'Brief',
          full_slug: 'brief',
          content: { _uid: 'e2e', component: 'brief', intro_heading: 'E2E heading', intro_copy: 'E2E copy' },
        },
      },
    }),
  )
  await fetchInBrowser(page)
  await expect(page.getByRole('heading', { name: 'E2E heading' })).toBeVisible()
  await expect(page.getByText('E2E copy')).toBeVisible()
})

test('the brief still starts when Storyblok fails', async ({ page }) => {
  await page.route(STORY, (route) => route.abort())
  await fetchInBrowser(page)
  await expect(page.getByRole('heading', { name: 'Create your brief' })).toBeVisible()
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page).toHaveURL(/step=1/)
})

test('the Visual Editor shows the intro, and leaves a brief in progress alone', async ({ page, goto }) => {
  await goto('/brief', { waitUntil: 'hydration' })
  await page.getByRole('button', { name: 'Start' }).click()
  await page
    .getByRole('region')
    .first()
    .getByRole('checkbox', { name: /^Web Design/ })
    .focus()
  await page.keyboard.press('Space')
  await primary(page, 'Next').click()
  await expect(page).toHaveURL(/step=2/)

  // Without the editor, step=2 would open the question
  await goto('/brief?_storyblok=1&step=2', { waitUntil: 'hydration' })
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()

  await goto('/brief?step=2', { waitUntil: 'hydration' })
  await expect(page.getByRole('region').first()).toHaveAccessibleName(/what does your business do/)
})

test('the server sends /brief with its title and link preview', async ({ request }) => {
  const html = await (await request.get('/brief')).text()
  expect(html).toMatch(/<title>[^<]+ - ditta<\/title>/)
  expect(html).toMatch(/<meta name="description" content="[^"]+">/)
  expect(html).toMatch(/<meta property="og:title" content="[^"]+">/)
})
