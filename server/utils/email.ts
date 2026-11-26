// Sends through Resend's REST API with $fetch: a couple of calls don't need the SDK
import type { H3Event } from 'h3'

export interface OutgoingEmail {
  to: string
  replyTo?: string
  subject: string
  html: string
  text: string
}

// One email, or several in one batch call. In `nuxt dev` without NUXT_RESEND_API_KEY they're logged, not sent.
export async function sendEmails(event: H3Event | undefined, emails: OutgoingEmail[]) {
  const config = useRuntimeConfig(event)

  if (!config.resendApiKey) {
    if (!import.meta.dev) throw createError({ statusCode: 500, message: 'The brief isn’t set up to send yet' })
    for (const email of emails)
      console.info(`[brief] No NUXT_RESEND_API_KEY, so not sent to ${email.to}:\n${email.subject}\n\n${email.text}\n`)
    return
  }

  const bodies = emails.map(({ to, replyTo, subject, html, text }) => ({
    from: config.brief.from,
    to,
    reply_to: replyTo,
    subject,
    html,
    text,
  }))

  try {
    await $fetch(bodies.length === 1 ? 'https://api.resend.com/emails' : 'https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resendApiKey}` },
      body: bodies.length === 1 ? bodies[0] : bodies,
    })
  } catch (error) {
    console.error('[brief] Resend failed', (error as { data?: unknown }).data ?? error)
    throw createError({ statusCode: 502, message: 'The email didn’t send. Try again.' })
  }
}
