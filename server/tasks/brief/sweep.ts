// Hourly (nuxt.config.ts → scheduledTasks): deletes briefs left unconfirmed for two weeks and confirmed briefs (with
// their PDFs) after six months, sends the emails for confirmed briefs whose emails failed at the time, and keeps the
// PDFs of briefs whose PDF failed (their emails went without it, so this sends nothing)
export default defineTask({
  meta: { name: 'brief:sweep', description: 'Delete expired briefs and retry failed brief emails' },
  async run() {
    const db = useBriefDb()
    const now = Date.now()

    const deleted = await db
      .prepare("DELETE FROM briefs WHERE status = 'pending' AND updated_at < ?")
      .bind(now - BRIEF_PENDING_TTL_MS)
      .run()

    // The PDFs go first, so a failure leaves the row to try again next hour rather than an orphaned PDF
    const { results: expired } = await db
      .prepare("SELECT id, pdf_key FROM briefs WHERE status = 'confirmed' AND confirmed_at < ? LIMIT 50")
      .bind(now - BRIEF_CONFIRMED_TTL_MS)
      .all<Pick<BriefRow, 'id' | 'pdf_key'>>()

    const pdfKeys = expired.flatMap((row) => row.pdf_key ?? [])
    if (pdfKeys.length) await useBriefPdfBucket()?.delete(pdfKeys)
    if (expired.length) {
      await db
        .prepare(`DELETE FROM briefs WHERE id IN (${expired.map(() => '?').join(', ')})`)
        .bind(...expired.map((row) => row.id))
        .run()
    }

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

    // Only where there's a bucket to keep them in, or this would render the same PDFs every hour. A few at a time,
    // since each may wait 10 seconds for its turn (server/utils/briefPdf.ts)
    let archived = 0
    if (useBriefPdfBucket()) {
      const { results: unarchived } = await db
        .prepare(
          "SELECT * FROM briefs WHERE status = 'confirmed' AND notified_at IS NOT NULL AND pdf_key IS NULL ORDER BY confirmed_at LIMIT 3",
        )
        .all<BriefRow>()
      for (const row of unarchived) if (await briefPdf(db, row)) archived++
    }

    return {
      result: {
        deleted: deleted.meta.changes,
        expired: expired.length,
        notified,
        failed: results.length - notified,
        archived,
      },
    }
  },
})
