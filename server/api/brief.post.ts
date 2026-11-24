import { briefSubmitSchema } from '#shared/schemas/brief'
import { briefEmail } from '../emails/brief'

// Briefs sent sooner than this after the first answer are taken for bots
const MIN_ELAPSED_MS = 20_000

// Cloudflare's always-pass Turnstile secret, used only in `nuxt dev` when no secret is set
const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA'

interface RateLimiter {
  limit: (options: { key: string }) => Promise<{ success: boolean }>
}

interface TurnstileResult {
  success: boolean
  'error-codes'?: string[]
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const ip = getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'

  // Per IP, through the Workers rate limit binding in wrangler.jsonc. Absent in `nuxt dev` and on branch previews.
  const limiter = (event.context.cloudflare?.env as { BRIEF_RATE_LIMIT?: RateLimiter } | undefined)?.BRIEF_RATE_LIMIT
  if (limiter && !(await limiter.limit({ key: ip })).success) {
    throw createError({ statusCode: 429, message: 'Too many briefs at once. Try again in a minute.' })
  }

  const body = await readValidatedBody(event, (value) => briefSubmitSchema.parse(value))

  // A bot gets the same answer as a person, so it learns nothing from being turned away
  if (body.honeypot || body.elapsed < MIN_ELAPSED_MS) return { ok: true }

  const secret = config.turnstileSecretKey || (import.meta.dev ? TURNSTILE_TEST_SECRET : '')
  if (!secret) throw createError({ statusCode: 500, message: 'The brief isn’t set up to send yet' })

  const turnstile = await $fetch<TurnstileResult>('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: { secret, response: body.turnstileToken, remoteip: ip },
  }).catch(() => null)

  if (!turnstile?.success) {
    throw createError({ statusCode: 403, message: 'We couldn’t check you’re not a robot. Try again.' })
  }

  const email = briefEmail(body.answers)

  if (!config.resendApiKey) {
    if (!import.meta.dev) throw createError({ statusCode: 500, message: 'The brief isn’t set up to send yet' })
    console.info(`[brief] No NUXT_RESEND_API_KEY, so not sent:\n${email.subject}\n\n${email.text}`)
    return { ok: true }
  }

  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resendApiKey}` },
      body: {
        from: config.brief.from,
        to: config.brief.to,
        reply_to: body.answers.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      },
    })
  } catch (error) {
    console.error('[brief] Resend failed', (error as { data?: unknown }).data ?? error)
    throw createError({ statusCode: 502, message: 'Your brief didn’t send. Try again.' })
  }

  return { ok: true }
})
