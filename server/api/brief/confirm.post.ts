import { briefTokenSchema } from '#shared/schemas/brief'

// Confirm and send: the brief is confirmed and locked, and the page told so at once. The team's email and the client's
// copy go after the response, since the PDF can take a while. If they fail, or run out of time, the brief still
// counts, and the sweep (server/tasks/brief/sweep.ts) sends them later.
export default defineEventHandler(async (event) => {
  const { token } = await readValidatedBody(event, (value) => briefTokenSchema.parse(value))
  const db = useBriefDb(event)
  const now = Date.now()

  // In one statement, so two clicks at once can't both send it
  const row = await db
    .prepare(
      `UPDATE briefs SET status = 'confirmed', confirmed_at = ?, updated_at = ?
        WHERE token_hash = ? AND status = 'pending' AND token_expires_at > ? RETURNING *`,
    )
    .bind(now, now, await sha256(token), now)
    .first<BriefRow>()

  // Already confirmed, expired or replaced: the page says which
  if (!row) return briefLinkState(await briefByToken(event, token), now)

  event.waitUntil(
    notifyBrief(db, row, event, { hurry: true }).catch((error) =>
      console.error('[brief] Confirmed, but the emails failed; the sweep will retry', row.id, error),
    ),
  )

  return briefLinkState(row, now)
})
