// The sent briefs in D1 (server/database/migrations), and what ties one to its email link and to the browser that
// sent it. See "Id vs token vs cookie" in docs/plans/brief-builder.md.
import type { H3Event } from 'h3'
import type { BriefAnswers, BriefLinkState } from '#shared/schemas/brief'
import { briefConfirmEmail, briefCopyEmail, briefTeamEmail } from '../emails/brief'

// How long an email link works for
export const BRIEF_TOKEN_TTL_MS = 72 * 60 * 60 * 1000
// How long an unconfirmed brief is kept after its last send (server/tasks/brief/sweep.ts)
export const BRIEF_PENDING_TTL_MS = 14 * 24 * 60 * 60 * 1000
// The most times one brief's link can be sent. The least time between two sends is BRIEF_RESEND_COOLDOWN_MS, in
// shared/utils/brief.ts, since Check your inbox counts it down too.
export const BRIEF_MAX_SENDS = 10

const OWNER_COOKIE = 'brief_owner'

// Only the parts of Cloudflare's D1 binding used here, rather than a dependency for its types
interface D1Statement {
  bind: (...values: unknown[]) => D1Statement
  first: <T>() => Promise<T | null>
  run: () => Promise<{ meta: { changes: number } }>
  all: <T>() => Promise<{ results: T[] }>
}

interface D1Database {
  prepare: (sql: string) => D1Statement
}

export interface BriefRow {
  id: string
  name: string
  email: string
  status: 'pending' | 'confirmed'
  answers: string
  token_hash: string
  token_expires_at: number
  owner_hash: string
  send_count: number
  last_sent_at: number
  confirmed_at: number | null
  notified_at: number | null
  created_at: number
  updated_at: number
}

declare global {
  // Set by Nitro's Cloudflare runtime for each request and scheduled event, and by its dev proxy in `nuxt dev`
  var __env__: { DB?: D1Database } | undefined
}

export function useBriefDb(event?: H3Event) {
  const env = (event?.context.cloudflare?.env as { DB?: D1Database } | undefined) ?? globalThis.__env__
  if (!env?.DB) throw createError({ statusCode: 500, message: 'The brief isn’t set up to send yet' })
  return env.DB
}

export const parseBriefAnswers = (row: Pick<BriefRow, 'answers'>) => JSON.parse(row.answers) as BriefAnswers

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')

const randomSecret = () => toBase64Url(crypto.getRandomValues(new Uint8Array(32)))

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

// A fresh email link token, and what's stored in its place
export async function newBriefToken(now = Date.now()) {
  const token = randomSecret()
  return { token, tokenHash: await sha256(token), expiresAt: now + BRIEF_TOKEN_TTL_MS }
}

// This browser's draft cookie, set the first time it sends a brief. Only its hash is stored.
export async function briefOwnerHash(event: H3Event, { create = false } = {}) {
  let owner = getCookie(event, OWNER_COOKIE)

  if (!owner && create) {
    owner = randomSecret()
    setCookie(event, OWNER_COOKIE, owner, {
      httpOnly: true,
      secure: !import.meta.dev,
      sameSite: 'lax',
      path: '/api/brief',
      maxAge: (BRIEF_PENDING_TTL_MS * 2) / 1000,
    })
  }

  return owner ? sha256(owner) : null
}

// A brief this browser sent, or a 404 for anyone else's, so an id alone gives nothing away
export async function ownedBrief(event: H3Event, id: string) {
  const ownerHash = await briefOwnerHash(event)
  const row = ownerHash
    ? await useBriefDb(event).prepare('SELECT * FROM briefs WHERE id = ?').bind(id).first<BriefRow>()
    : null

  // Marked, so Check your inbox gives up only on this answer, not on any 404 (a route missing mid-deploy, a broken
  // dev build), which would otherwise throw away a brief that's still waiting on its link
  if (!row || row.owner_hash !== ownerHash) {
    throw createError({ statusCode: 404, message: 'That brief has gone', data: { gone: true } })
  }
  return row
}

// The confirm link, on whichever host the brief was sent from (production, a preview, or localhost)
export const briefConfirmLink = (event: H3Event, token: string) =>
  `${getRequestURL(event).origin}/brief/confirm?token=${encodeURIComponent(token)}`

// Sends a pending brief its email link
export async function sendBriefLink(event: H3Event, row: Pick<BriefRow, 'name' | 'email'>, token: string) {
  const answers = { name: row.name } as BriefAnswers
  await sendEmails(event, [{ to: row.email, ...briefConfirmEmail(answers, briefConfirmLink(event, token)) }])
}

// The team's email and the client's copy, once a brief is confirmed. Marked notified only once both have gone, so
// the sweep tries again if Resend fails.
export async function notifyBrief(db: D1Database, row: BriefRow, event?: H3Event) {
  const answers = parseBriefAnswers(row)
  const config = useRuntimeConfig(event)

  await sendEmails(event, [
    { to: config.brief.to, replyTo: row.email, ...briefTeamEmail(answers) },
    // Replies (with files, as the copy invites) go to the team rather than the briefs@ sender
    { to: row.email, replyTo: config.brief.to, ...briefCopyEmail(answers) },
  ])

  await db.prepare('UPDATE briefs SET notified_at = ? WHERE id = ?').bind(Date.now(), row.id).run()
}

export const briefByToken = async (event: H3Event, token: string) =>
  useBriefDb(event)
    .prepare('SELECT * FROM briefs WHERE token_hash = ?')
    .bind(await sha256(token))
    .first<BriefRow>()

export function briefLinkState(row: BriefRow | null, now = Date.now()): BriefLinkState {
  if (!row) return { state: 'invalid' }
  if (row.status === 'confirmed') {
    return { state: 'confirmed', id: row.id, name: row.name, confirmedAt: row.confirmed_at ?? row.updated_at }
  }
  if (row.token_expires_at <= now) return { state: 'expired' }
  return { state: 'pending', id: row.id, name: row.name, email: row.email, business: parseBriefAnswers(row).business }
}
