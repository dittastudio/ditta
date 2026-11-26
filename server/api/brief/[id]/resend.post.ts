import { briefResendSchema } from '#shared/schemas/brief'

// "Not received your email?": sends the link again, to a corrected address if one was given. The old link stops
// working, and it's still one brief however many times it's sent.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const { email } = await readValidatedBody(event, (value) => briefResendSchema.parse(value))
  const row = await ownedBrief(event, id)

  if (row.status === 'confirmed') return { status: row.status, email: row.email }

  const now = Date.now()
  const wait = row.last_sent_at + BRIEF_RESEND_COOLDOWN_MS - now
  if (wait > 0) {
    setResponseHeader(event, 'Retry-After', Math.ceil(wait / 1000))
    throw createError({ statusCode: 429, message: `Wait ${Math.ceil(wait / 1000)} seconds to send it again` })
  }
  if (row.send_count >= BRIEF_MAX_SENDS) {
    throw createError({ statusCode: 429, message: 'That’s as many times as we can send it. Start a new brief.' })
  }

  const { token, tokenHash, expiresAt } = await newBriefToken(now)

  // The answers keep the email too, so the team and the copy see the corrected one
  await useBriefDb(event)
    .prepare(
      `UPDATE briefs SET email = ?, answers = json_set(answers, '$.email', ?), token_hash = ?, token_expires_at = ?,
        send_count = send_count + 1, last_sent_at = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(email, email, tokenHash, expiresAt, now, now, id)
    .run()

  await sendBriefLink(event, { name: row.name, email }, token)

  return { status: row.status, email }
})
