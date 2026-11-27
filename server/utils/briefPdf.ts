// The confirmed brief's PDF: rendered once by Cloudflare Browser Run, archived in R2 (`briefs/{id}.pdf`), and attached
// to the team's email and the client's copy. A PDF that fails never holds the brief up: the emails go without it,
// and the sweep (server/tasks/brief/sweep.ts) archives it later.
import type { H3Event } from 'h3'
import { briefPdfHtml, briefReference, toBase64 } from '../pdf/brief'

// Only the parts of R2's binding used here, rather than a dependency for its types
interface R2Bucket {
  get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> } | null>
  put: (key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>
  delete: (keys: string | string[]) => Promise<void>
}

export interface BriefPdfAttachment {
  filename: string
  // Base64, as Resend takes it
  content: string
}

// Absent until R2 is set up for the account, and on any Worker without the binding: the PDF is still attached, just
// not kept
export function useBriefPdfBucket(event?: H3Event) {
  const env = (event?.context.cloudflare?.env ?? globalThis.__env__) as { BRIEF_PDFS?: R2Bucket } | undefined
  return env?.BRIEF_PDFS
}

// HTML in, PDF out, through Browser Run's /pdf quick action. Null when the account isn't set up for it.
async function renderPdf(event: H3Event | undefined, html: string, hurry: boolean) {
  const { accountId, browserToken } = useRuntimeConfig(event).cloudflare
  if (!accountId || !browserToken) {
    console.info('[brief] No NUXT_CLOUDFLARE_BROWSER_TOKEN or account ID, so no PDF')
    return null
  }

  const pdf = await $fetch<ArrayBuffer>(`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-run/pdf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${browserToken}` },
    // The page sets its own size and margins (@page), and its grey panel is a background
    body: { html, pdfOptions: { printBackground: true, preferCSSPageSize: true } },
    responseType: 'arrayBuffer',
    timeout: hurry ? 15_000 : 30_000,
    // The free plan renders one every 10 seconds, so the sweep's next waits its turn rather than going without. Not
    // in a hurry, where waiting would cost the emails their chance to go.
    retry: hurry ? 0 : 1,
    retryDelay: 10_000,
    retryStatusCodes: [429, 500, 502, 503, 504],
  })
  return new Uint8Array(pdf)
}

// The brief's PDF, from R2 if it was kept, otherwise rendered now (and kept, where there's a bucket). Null if it
// can't be had, for the emails to go without it. `hurry` gives the render one quick try (see notifyBrief).
export async function briefPdf(
  db: ReturnType<typeof useBriefDb>,
  row: BriefRow,
  event?: H3Event,
  { hurry = false } = {},
): Promise<BriefPdfAttachment | null> {
  const bucket = useBriefPdfBucket(event)
  const filename = `ditta-brief-${briefReference(row.id)}.pdf`

  try {
    const kept = row.pdf_key && bucket ? await bucket.get(row.pdf_key) : null
    if (kept) return { filename, content: toBase64(new Uint8Array(await kept.arrayBuffer())) }

    const html = await briefPdfHtml(parseBriefAnswers(row), {
      id: row.id,
      confirmedAt: row.confirmed_at ?? row.updated_at,
    })
    const pdf = await renderPdf(event, html, hurry)
    if (!pdf) return null

    if (bucket) {
      const key = `briefs/${row.id}.pdf`
      await bucket.put(key, pdf, { httpMetadata: { contentType: 'application/pdf' } })
      await db.prepare('UPDATE briefs SET pdf_key = ? WHERE id = ?').bind(key, row.id).run()
    }

    return { filename, content: toBase64(pdf) }
  } catch (error) {
    console.error('[brief] The PDF failed, so the emails go without it', row.id, error)
    return null
  }
}
