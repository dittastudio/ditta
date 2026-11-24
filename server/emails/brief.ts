// The team's email for a new brief: every answer in the summary's order, as HTML with a plain-text twin
import type { BriefAnswers } from '#shared/schemas/brief'
import type { BriefLinkRow } from '#shared/utils/brief'

interface BriefEmailRow {
  title: string
  answer: string | null
  // Link rows, kept apart so the HTML can make each one clickable
  links?: BriefLinkRow[]
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

const isLinkRows = (value: unknown): value is BriefLinkRow[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null && 'url' in item)

function rowsFor(answers: BriefAnswers): BriefEmailRow[] {
  return briefSteps.flatMap((step) =>
    [step, ...visibleFollowUps(step, answers)].map((question) => {
      const value: unknown = answers[question.key]
      return {
        title: personaliseBrief(question.title, answers),
        answer: formatBriefAnswer(value),
        links: isLinkRows(value) && value.length ? value : undefined,
      }
    }),
  )
}

function answerHtml(row: BriefEmailRow) {
  if (row.links) {
    return row.links
      .map(({ url = '', note }) => {
        const link = `<a href="${escapeHtml(url)}" style="color:#000">${escapeHtml(url)}</a>`
        return note?.trim() ? `${link}<br><span style="color:#666">${escapeHtml(note.trim())}</span>` : link
      })
      .join('<br><br>')
  }

  if (!row.answer) return '<em style="color:#999">Skipped</em>'
  return escapeHtml(row.answer)
}

export function briefEmail(answers: BriefAnswers) {
  const rows = rowsFor(answers)
  const subject = `New brief: ${answers.name}, ${answers.business}`

  const text = [
    subject,
    '',
    ...rows.flatMap((row) => [row.title, row.answer ?? 'Skipped', '']),
    `Reply to this email to answer ${briefFirstName(answers) || 'them'} directly.`,
  ].join('\n')

  // Email clients want tables and inline styles. Colours are plain hex here: the site's tokens don't reach an inbox.
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#000">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px">
      <tr><td style="padding:32px 32px 8px;font-size:22px;line-height:1.3">${escapeHtml(subject)}</td></tr>
      ${rows
        .map(
          (row) => `<tr><td style="padding:16px 32px;border-top:1px solid #eee">
        <div style="font-size:13px;line-height:1.4;color:#666">${escapeHtml(row.title)}</div>
        <div style="padding-top:6px;font-size:16px;line-height:1.5">${answerHtml(row)}</div>
      </td></tr>`,
        )
        .join('\n      ')}
      <tr><td style="padding:24px 32px 32px;border-top:1px solid #eee;font-size:13px;color:#666">Reply to this email to answer ${escapeHtml(briefFirstName(answers) || 'them')} directly.</td></tr>
    </table>
  </body>
</html>`

  return { subject, html, text }
}
