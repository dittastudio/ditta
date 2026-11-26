// Hourly (nuxt.config.ts → scheduledTasks): deletes briefs left unconfirmed for two weeks, and sends the emails for
// confirmed briefs whose emails failed at the time
export default defineTask({
  meta: { name: 'brief:sweep', description: 'Delete stale pending briefs and retry failed brief emails' },
  async run() {
    const db = useBriefDb()
    const now = Date.now()

    const deleted = await db
      .prepare("DELETE FROM briefs WHERE status = 'pending' AND updated_at < ?")
      .bind(now - BRIEF_PENDING_TTL_MS)
      .run()

    // Left a few minutes, so a confirm still sending its emails isn't sent twice
    const { results } = await db
      .prepare("SELECT * FROM briefs WHERE status = 'confirmed' AND notified_at IS NULL AND confirmed_at < ? LIMIT 10")
      .bind(now - 5 * 60 * 1000)
      .all<BriefRow>()

    let notified = 0
    for (const row of results) {
      try {
        await notifyBrief(db, row)
        notified++
      } catch (error) {
        console.error('[brief] Retry failed', row.id, error)
      }
    }

    return { result: { deleted: deleted.meta.changes, notified, failed: results.length - notified } }
  },
})
