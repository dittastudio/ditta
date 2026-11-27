// Dev only: follows the newest confirm link sent to the sample brief's address (app/pages/_dev/brief.vue), read from
// the dev outbox. Works while there's no NUXT_RESEND_API_KEY, so emails land in the outbox rather than being sent.
const SAMPLE_EMAIL = 'delivered@resend.dev'

export default defineEventHandler((event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404 })

  const confirm = devOutbox
    .filter((email) => email.to.toLowerCase() === SAMPLE_EMAIL && email.subject.startsWith('Confirm and send'))
    .at(-1)
  const link = confirm?.text.match(/https?:\/\/\S+/)?.[0]

  if (!link) {
    throw createError({
      statusCode: 404,
      message: `No confirm email to ${SAMPLE_EMAIL} in the dev outbox. Send the brief first, without a Resend key.`,
    })
  }

  return sendRedirect(event, link)
})
