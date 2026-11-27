import { briefSubmitSchema } from '#shared/schemas/brief'

// Briefs sent sooner than this after the first answer are taken for bots
const MIN_ELAPSED_MS = 20_000

// Cloudflare's always-pass Turnstile secret, used only in `nuxt dev` when no secret is set
const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA'

interface TurnstileResult {
  success: boolean
  'error-codes'?: string[]
}

// Send brief: stores the brief as pending and emails the client the link that confirms it. Nothing reaches the team
// until that's clicked (api/brief/confirm.post.ts). Sent again after an edit, it updates the same brief.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const ip = getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'

  // Per IP, through the Workers rate limit binding in wrangler.jsonc. Absent on branch previews.
  const limiter = event.context.cloudflare?.env.BRIEF_RATE_LIMIT
  if (limiter && !(await limiter.limit({ key: ip })).success) {
    throw createError({ statusCode: 429, message: 'Too many briefs at once. Try again in a minute.' })
  }

  const body = await readValidatedBody(event, (value) => briefSubmitSchema.parse(value))

  // A bot gets the same answer as a person, so it learns nothing from being turned away
  if (body.honeypot || body.elapsed < MIN_ELAPSED_MS) return { id: crypto.randomUUID(), email: body.answers.email }

  const secret = config.turnstileSecretKey || (import.meta.dev ? TURNSTILE_TEST_SECRET : '')
  if (!secret) throw createError({ statusCode: 500, message: 'The brief isn’t set up to send yet' })

  const turnstile = await $fetch<TurnstileResult>('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: { secret, response: body.turnstileToken, remoteip: ip },
  }).catch(() => null)

  if (!turnstile?.success) {
    throw createError({ statusCode: 403, message: 'We couldn’t check you’re not a robot. Try again.' })
  }

  const db = useBriefDb(event)
  const now = Date.now()
  const ownerHash = (await briefOwnerHash(event, { create: true }))!
  const { token, tokenHash, expiresAt } = await newBriefToken(now)
  const { name, email } = body.answers
  const answers = JSON.stringify(body.answers)

  // Only this browser's own brief, and only while it's pending: a confirmed brief is locked, so an edit after that
  // is a new brief. So is one already sent as many times as it can be (BRIEF_MAX_SENDS), which is what its "Start a
  // new brief" asks for.
  const pending = body.id
    ? await db
        .prepare("SELECT * FROM briefs WHERE id = ? AND owner_hash = ? AND status = 'pending'")
        .bind(body.id, ownerHash)
        .first<BriefRow>()
    : null
  const existing = pending && pending.send_count < BRIEF_MAX_SENDS ? pending : null

  // Sent again after an edit, it waits as long as Resend does, so Back and Send isn't a way round it
  const wait = existing ? existing.last_sent_at + config.public.brief.resendCooldownMs - now : 0
  if (wait > 0) {
    setResponseHeader(event, 'Retry-After', Math.ceil(wait / 1000))
    throw createError({ statusCode: 429, message: `Wait ${Math.ceil(wait / 1000)} seconds to send it again` })
  }

  const id = existing?.id ?? crypto.randomUUID()

  if (existing) {
    await db
      .prepare(
        `UPDATE briefs SET name = ?, email = ?, answers = ?, token_hash = ?, token_expires_at = ?,
          send_count = send_count + 1, last_sent_at = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(name, email, answers, tokenHash, expiresAt, now, now, id)
      .run()
  } else {
    await db
      .prepare(
        `INSERT INTO briefs (id, name, email, answers, token_hash, token_expires_at, owner_hash, last_sent_at,
          created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, name, email, answers, tokenHash, expiresAt, ownerHash, now, now, now)
      .run()
  }

  try {
    // One sent before goes back to how it was if this fails, so its last link still works
    if (existing) await sendBriefLinkOrRestore(event, existing, { name, email }, token)
    else await sendBriefLink(event, { name, email }, token)
  } catch (error) {
    // A brief new this time goes again with the failed send, so trying again doesn't leave two behind
    if (!existing) await db.prepare('DELETE FROM briefs WHERE id = ?').bind(id).run()
    throw createError({ statusCode: 502, message: 'Your brief didn’t send. Try again.', cause: error })
  }

  return { id, email }
})
