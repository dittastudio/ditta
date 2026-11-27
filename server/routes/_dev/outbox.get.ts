// Dev only: the emails sent to ?to=, newest last, as captured by sendEmails without a Resend key (server/utils/email.ts)
export default defineEventHandler((event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404 })

  const to = (getQuery<{ to?: string }>(event).to ?? '').toLowerCase()
  return devOutbox.filter((email) => email.to.toLowerCase() === to)
})
