// /_dev/outbox, dev only (nuxt.config.ts → $development): the emails sent to ?to=, newest last, as captured by
// sendEmails without a Resend key (server/utils/email.ts)
export default defineEventHandler((event) => {
  const to = (getQuery<{ to?: string }>(event).to ?? '').toLowerCase()
  return devOutbox.filter((email) => email.to.toLowerCase() === to)
})
