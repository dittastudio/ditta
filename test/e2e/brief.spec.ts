import { expect, test } from '@nuxt/test-utils/playwright'
import { confirmLink, fillBrief, open, outbox, primary, sendBrief, visitor } from './helpers'

// The brief builder from the first step to the brief reaching the team (docs/plans/brief-builder.md, Verification).
// Real email delivery, the PDF and the real Turnstile are checked on the preview instead.

test('a sent brief reaches the team once its link is confirmed, and the waiting tab says thanks', async ({
  page,
  context,
  request,
}) => {
  const client = await visitor(context)
  await fillBrief(page, client)
  await sendBrief(page)
  await expect(page.getByText(client.email, { exact: true })).toBeVisible()

  const link = await confirmLink(request, client.email)
  const confirmPage = await context.newPage()
  await open(confirmPage, link)
  await expect(confirmPage.getByRole('heading', { name: 'Send your brief?' })).toBeVisible()
  await confirmPage.getByRole('button', { name: 'Confirm and send' }).click()
  await expect(confirmPage.getByRole('heading', { name: /We've got your brief/ })).toBeVisible()

  // The first tab, polling, flips to the thanks
  await expect(page.getByRole('heading', { name: /We've got your brief/ })).toBeVisible({ timeout: 15_000 })

  const team = await outbox(request, 'team@e2e.test')
  expect(team.some((email) => email.subject.startsWith(`New brief: ${client.name}`))).toBe(true)
  const copies = (await outbox(request, client.email)).filter((email) => email.subject === 'We’ve got your brief')
  expect(copies).toHaveLength(1)
})

test('opening the link changes nothing until its button is pressed', async ({ page, context, request }) => {
  const client = await visitor(context)
  await fillBrief(page, client)
  await sendBrief(page)

  const confirmPage = await context.newPage()
  await open(confirmPage, await confirmLink(request, client.email))
  await expect(confirmPage.getByRole('heading', { name: 'Send your brief?' })).toBeVisible()

  // Past a few of the inbox's 4-second polls: still waiting, and nothing sent to the team
  await page.waitForTimeout(6_000)
  await expect(page.getByRole('heading', { name: 'Check your inbox to finish' })).toBeVisible()
  const team = await outbox(request, 'team@e2e.test')
  expect(team.some((email) => email.subject.startsWith(`New brief: ${client.name}`))).toBe(false)
})

test('a mistyped email is fixed from the inbox, and only the newest link works', async ({ page, context, request }) => {
  test.setTimeout(90_000)
  const client = await visitor(context)
  const typo = client.email.replace('@example.com', '@exampel.com')
  await fillBrief(page, { ...client, email: typo })
  await sendBrief(page)
  const oldLink = await confirmLink(request, typo)

  await page.getByRole('button', { name: 'Not received your email?' }).click()
  await page.getByRole('textbox', { name: 'Your email' }).fill(client.email)
  // The server holds resends 20 seconds apart, by its own clock
  await page.waitForTimeout(20_500)
  await primary(page, 'Resend').click()
  await expect(page.getByText(client.email, { exact: true })).toBeVisible()

  const newLink = await confirmLink(request, client.email)
  const confirmPage = await context.newPage()
  await open(confirmPage, oldLink)
  await expect(confirmPage.getByRole('heading', { name: "This link doesn't work" })).toBeVisible()

  await open(confirmPage, newLink)
  await confirmPage.getByRole('button', { name: 'Confirm and send' }).click()
  await expect(confirmPage.getByRole('heading', { name: /We've got your brief/ })).toBeVisible()

  // One brief: one email to the team, the copy to the right address only
  const team = (await outbox(request, 'team@e2e.test')).filter((email) => email.subject.includes(client.name))
  expect(team).toHaveLength(1)
  expect(await outbox(request, typo)).toHaveLength(1)
})

test('Resend counts down the wait between sends', async ({ page, context }) => {
  test.setTimeout(90_000)
  const client = await visitor(context)
  await fillBrief(page, client)
  await sendBrief(page)

  const waiting = primary(page, /^Resend in \d+s$/)
  await expect(waiting).toHaveText(/Resend in (20|19)s/)
  await expect(waiting).toHaveAttribute('aria-disabled', 'true')
  await expect(waiting).toHaveText(/Resend in 1[0-5]s/, { timeout: 10_000 })

  await expect(primary(page, 'Resend')).toBeVisible({ timeout: 20_000 })
  await expect(primary(page, 'Resend')).not.toHaveAttribute('aria-disabled', 'true')
})

test('a confirmed link says so when opened again', async ({ page, context, request }) => {
  const client = await visitor(context)
  await fillBrief(page, client)
  await sendBrief(page)

  const confirmPage = await context.newPage()
  await open(confirmPage, await confirmLink(request, client.email))
  await confirmPage.getByRole('button', { name: 'Confirm and send' }).click()
  await expect(confirmPage.getByRole('heading', { name: /We've got your brief/ })).toBeVisible()

  await confirmPage.reload()
  await expect(confirmPage.getByRole('heading', { name: 'Your brief has reached us' })).toBeVisible()
})

test.describe('validation', () => {
  test('a required step holds Next until it is answered', async ({ page, goto }) => {
    await goto('/brief', { waitUntil: 'hydration' })
    await page.getByRole('button', { name: 'Start' }).click()
    await primary(page, 'Next').click()

    await expect(page).toHaveURL(/step=1/)
    await expect(page.getByText('Answer to continue')).toBeVisible()
  })

  test('an invalid email holds the review', async ({ page, context }) => {
    const client = await visitor(context)
    await fillBrief(page, client)
    await page.getByRole('button', { name: 'Back' }).click()

    await page.getByRole('region').first().getByRole('textbox').fill('sam@')
    await primary(page, 'Review').click()
    await expect(page).toHaveURL(/step=12/)
    await expect(page.getByText('Enter a valid email')).toBeVisible()
  })
})

test.describe('spam checks', () => {
  test('a brief sent too fast gets a quiet success and sends nothing', async ({ page, context, request }) => {
    const client = await visitor(context)
    await fillBrief(page, client)
    // Without takeYourTime: sent within seconds of starting
    await primary(page, 'Send').click()
    await expect(page.getByRole('heading', { name: 'Check your inbox to finish' })).toBeVisible()

    await page.waitForTimeout(2_000)
    expect(await outbox(request, client.email)).toHaveLength(0)
  })

  test('a fourth brief in a minute from one IP is turned away', async ({ request }) => {
    const ip = `10.250.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`
    const post = () => request.post('/api/brief', { headers: { 'cf-connecting-ip': ip }, data: {} })

    // The limit is checked before anything else, so even empty bodies count
    for (let i = 0; i < 3; i++) expect((await post()).status()).toBe(400)
    const fourth = await post()
    expect(fourth.status()).toBe(429)
    expect((await fourth.json()).message).toContain('Too many briefs')
  })
})
