import { expect, test } from '@playwright/test'
import { confirmLink, fillBrief, sendBrief, visitor } from './helpers'

// The brief's funnel events (app/composables/useBriefTracking.ts). Plausible ignores localhost and pages run by a test
// browser, so this visits e2e.localhost, lets the tracker know it's wanted, and catches its requests before they
// leave the machine.
const HOST = 'http://e2e.localhost:3100'

test('the funnel reaches Plausible, with nothing from the answers', async ({ page, context, request }) => {
  const events: { n: string; p?: Record<string, string> }[] = []
  await context.addInitScript(() => Object.assign(window, { __plausible: true }))
  await context.route('https://plausible.io/api/event', async (route) => {
    events.push(route.request().postDataJSON())
    await route.fulfill({ status: 202, body: 'ok' })
  })

  const client = await visitor(context)
  await fillBrief(page, client, HOST)
  await sendBrief(page)

  const confirmPage = await context.newPage()
  await confirmPage.goto((await confirmLink(request, client.email)).replace(/^https?:\/\/[^/]+/, HOST))
  await confirmPage.getByRole('button', { name: 'Confirm and send' }).click()
  await expect(confirmPage.getByRole('heading', { name: /We've got your brief/ })).toBeVisible()

  await expect.poll(() => events.some((event) => event.n === 'Brief: Confirmed')).toBe(true)
  const funnel = events.filter((event) => event.n.startsWith('Brief:'))
  expect(funnel.map((event) => event.n)).toEqual([
    'Brief: Started',
    ...Array(12).fill('Brief: Step'),
    'Brief: Review',
    'Brief: Sent',
    'Brief: Confirmed',
  ])
  expect(funnel.filter((event) => event.n === 'Brief: Step').map((event) => event.p?.number)).toEqual(
    Array.from({ length: 12 }, (_, index) => String(index + 1)),
  )
  expect(JSON.stringify(events)).not.toContain(client.email)
  expect(JSON.stringify(events)).not.toContain('Sam Taylor')
})
