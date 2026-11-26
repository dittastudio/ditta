// Sends through Resend's REST API with $fetch: a couple of calls don't need the SDK
import type { H3Event } from 'h3'

export interface OutgoingEmail {
  to: string
  replyTo?: string
  subject: string
  html: string
  text: string
  // Base64 content, as Resend takes it
  attachments?: { filename: string; content: string }[]
  // So a retry doesn't send it twice: Resend sends each key once a day
  idempotencyKey?: string
}

// One email, or several in one batch call. Resend's batch call takes no attachments, so emails with one go one at a
// time. In `nuxt dev` without NUXT_RESEND_API_KEY they're logged, not sent.
export async function sendEmails(event: H3Event | undefined, emails: OutgoingEmail[]) {
  const config = useRuntimeConfig(event)

  if (!config.resendApiKey) {
    if (!import.meta.dev) throw createError({ statusCode: 500, message: 'The brief isn’t set up to send yet' })
    for (const email of emails) {
      const attached = email.attachments?.map(({ filename }) => filename).join(', ')
      console.info(
        `[brief] No NUXT_RESEND_API_KEY, so not sent to ${email.to}${attached ? ` (with ${attached})` : ''}:\n${email.subject}\n\n${email.text}\n`,
      )
    }
    return
  }

  const body = ({ to, replyTo, subject, html, text, attachments }: OutgoingEmail) => ({
    from: config.brief.from,
    to,
    reply_to: replyTo,
    subject,
    html,
    text,
    attachments,
  })
  const headers = { Authorization: `Bearer ${config.resendApiKey}` }

  try {
    if (emails.length > 1 && !emails.some((email) => email.attachments?.length)) {
      await $fetch('https://api.resend.com/emails/batch', { method: 'POST', headers, body: emails.map(body) })
      return
    }

    for (const email of emails) {
      await $fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: email.idempotencyKey ? { ...headers, 'Idempotency-Key': email.idempotencyKey } : headers,
        body: body(email),
      }).catch((error: { status?: number }) => {
        // Its key was used already, by a send that got through before a later one failed: it has gone
        if (email.idempotencyKey && error.status === 409) return
        throw error
      })
    }
  } catch (error) {
    console.error('[brief] Resend failed', (error as { data?: unknown }).data ?? error)
    throw createError({ statusCode: 502, message: 'The email didn’t send. Try again.' })
  }
}
