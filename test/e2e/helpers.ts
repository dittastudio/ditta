import type { APIRequestContext, BrowserContext, Page } from '@playwright/test'
import { waitForHydration } from '@nuxt/test-utils/e2e'
import { expect } from '@nuxt/test-utils/playwright'

// Opens a page and waits for Nuxt to hydrate it, as the `goto` fixture does for the test's own `page`. For the other
// tabs a test opens, and for helpers handed a page: a click before hydration lands on nothing.
export async function open(page: Page, url: string) {
  const response = await page.goto(url)
  await waitForHydration(page, url, 'hydration')
  return response
}

// The brief's own spam check turns away a brief sent within 20 seconds of starting (server/api/brief/index.post.ts).
// A test fills it in faster than that, so its sends say it took 25 seconds longer. (Playwright's fake clock would do
// it in the page, but it stalls Turnstile.)
export async function takeYourTime(page: Page) {
  await page.route('**/api/brief', async (route) => {
    const body = route.request().postDataJSON()
    await route.continue({ postData: JSON.stringify({ ...body, elapsed: body.elapsed + 25_000 }) })
  })
}

// Each test is its own visitor: its own address, so it reads only its own mail, and its own IP, so the rate limit (3
// briefs a minute per IP) doesn't count the other tests
export async function visitor(context: BrowserContext) {
  const id = crypto.randomUUID().slice(0, 8)
  await context.setExtraHTTPHeaders({ 'cf-connecting-ip': `10.${randomByte()}.${randomByte()}.${randomByte()}` })
  await context.route('https://challenges.cloudflare.com/turnstile/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: turnstileStandIn }),
  )
  return { email: `e2e+${id}@example.com`, name: `Sam Taylor ${id}` }
}

const randomByte = () => Math.floor(Math.random() * 254) + 1

const nav = (page: Page) => page.getByRole('navigation', { name: 'Brief steps' })
// A string label is matched exactly: 'Resend' isn't 'Resend in 12s'
export const primary = (page: Page, name: string | RegExp) => nav(page).getByRole('button', { name, exact: true })
const step = (page: Page) => page.getByRole('region').first()

// The cards' inputs sit under the card, so they're picked the way a keyboard user picks them
async function pick(page: Page, role: 'checkbox' | 'radio', name: string) {
  await step(page)
    .getByRole(role, { name: new RegExp(`^${name}`) })
    .focus()
  await page.keyboard.press('Space')
}

// Presses the nav's main button and waits for the next step: a press mid-transition would land on the wrong one
async function advance(page: Page, label: string) {
  const from = page.url()
  await primary(page, label).click()
  await expect(page).not.toHaveURL(from)
}

// Every step through the real form, up to the review. Optional steps are skipped.
export async function fillBrief(page: Page, { email, name }: { email: string; name: string }, origin = '') {
  await open(page, `${origin}/brief`)
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page).toHaveURL(/step=1/)

  await pick(page, 'checkbox', 'Web Design')
  await advance(page, 'Next')

  await step(page).getByRole('textbox').fill('Independent coffee roaster in Hackney')
  await advance(page, 'Next')

  await pick(page, 'checkbox', 'Sell online')
  await advance(page, 'Next')

  await pick(page, 'radio', 'ASAP')
  await advance(page, 'Next')

  // Competitors, then files
  await advance(page, 'Skip')
  await advance(page, 'Skip')

  await pick(page, 'radio', 'Ready to go')
  await advance(page, 'Next')

  // Moved and back, as a person would: its starting value is only kept once the slider settles
  await step(page).getByRole('slider').focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowLeft')
  await advance(page, 'Next')

  await step(page).getByRole('textbox').fill(name)
  await advance(page, 'Next')

  // Website
  await advance(page, 'Skip')

  await pick(page, 'radio', 'Google')
  await advance(page, 'Next')

  await step(page).getByRole('textbox').fill(email)
  await advance(page, 'Review')

  await expect(page).toHaveURL(/step=review/)
  await turnstilePassed(page)
}

// The review's Turnstile has its token, as it would by the time a person presses Send
async function turnstilePassed(page: Page) {
  await expect(page.locator('[data-brief-turnstile][data-passed]')).toBeAttached()
}

// Cloudflare's script, swapped for a stand-in that passes at once with Cloudflare's dummy token, which the server's
// always-pass test secret accepts (it still calls siteverify). The real script hangs in Playwright's browser, and the
// real Turnstile is a check on the preview.
const turnstileStandIn = `window.turnstile = {
  render(el, options) { setTimeout(() => options.callback('XXXX.DUMMY.TOKEN.XXXX'), 50); return 'e2e' },
  reset(id) {},
  remove(id) {},
}`

// Review → Send, by a visitor who took their time
export async function sendBrief(page: Page) {
  await takeYourTime(page)
  await primary(page, 'Send').click()
  await expect(page.getByRole('heading', { name: 'Check your inbox to finish' })).toBeVisible()
}

export interface OutboxEmail {
  to: string
  subject: string
  html: string
  text: string
  attachments: string[]
}

export async function outbox(request: APIRequestContext, to: string): Promise<OutboxEmail[]> {
  const response = await request.get(`/_dev/outbox?to=${encodeURIComponent(to)}`)
  return response.json()
}

// The link from the newest confirm email to this address, waiting for it to arrive
export async function confirmLink(request: APIRequestContext, to: string, after = 0) {
  let link = ''
  await expect
    .poll(async () => {
      const confirms = (await outbox(request, to)).filter((email) => email.subject.startsWith('Confirm and send'))
      link = confirms.length > after ? (confirms.at(-1)!.text.match(/https?:\/\/\S+/)?.[0] ?? '') : ''
      return link
    })
    .not.toBe('')
  return link
}
