import { expect, test } from '@nuxt/test-utils/playwright'
import { primary } from './helpers'

// /brief's intro comes from the `brief` story (app/pages/brief/index.vue). These stand in for Storyblok, so editing the
// real story's wording never breaks them.
const STORY = '**/v2/cdn/stories/brief?*'

test('the intro shows the story’s wording', async ({ page, goto }) => {
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
  await goto('/brief', { waitUntil: 'hydration' })
  await expect(page.getByRole('heading', { name: 'E2E heading' })).toBeVisible()
  await expect(page.getByText('E2E copy')).toBeVisible()
})

test('the brief still starts when Storyblok fails', async ({ page, goto }) => {
  await page.route(STORY, (route) => route.abort())
  await goto('/brief', { waitUntil: 'hydration' })
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
