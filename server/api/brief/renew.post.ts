import { briefTokenSchema } from '#shared/schemas/brief'

// An expired link's "Send me a new link": a fresh one to the same address. The old link proves the inbox, so this
// works from any device, unlike the resend from Check your inbox.
export default defineEventHandler(async (event) => {
  const { token } = await readValidatedBody(event, (value) => briefTokenSchema.parse(value))
  const row = await briefByToken(event, token)

  if (!row || row.status !== 'pending') return briefLinkState(row)

  const now = Date.now()
  if (
    row.last_sent_at + useRuntimeConfig(event).public.brief.resendCooldownMs > now ||
    row.send_count >= BRIEF_MAX_SENDS
  ) {
    throw createError({ statusCode: 429, message: 'We’ve only just sent one. Check your inbox.' })
  }

  const next = await newBriefToken(now)
  await useBriefDb(event)
    .prepare(
      `UPDATE briefs SET token_hash = ?, token_expires_at = ?, send_count = send_count + 1, last_sent_at = ?,
        updated_at = ? WHERE id = ?`,
    )
    .bind(next.tokenHash, next.expiresAt, now, now, row.id)
    .run()

  await sendBriefLinkOrRestore(event, row, row, next.token)

  return { state: 'renewed' as const, email: row.email }
})
