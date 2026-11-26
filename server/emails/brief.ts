// The brief builder's emails, as HTML with a plain-text twin: the link that confirms a brief, the team's copy of a
// confirmed brief, and the client's.
import type { BriefAnswers } from '#shared/schemas/brief'
import type { BriefLinkRow, BriefQuestion } from '#shared/utils/brief'

export interface BriefEmailRow {
  title: string
  answer: string | null
  // Link rows, kept apart so the HTML can make each one clickable
  links?: BriefLinkRow[]
}

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

const isLinkRows = (value: unknown): value is BriefLinkRow[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null && 'url' in item)

// One question and its answer, formatted. Shared with the PDF.
export function rowFor(question: BriefQuestion, answers: BriefAnswers): BriefEmailRow {
  const value: unknown = answers[question.key]
  return {
    title: personaliseBrief(question.title, answers),
    answer: formatBriefAnswer(value),
    links: isLinkRows(value) && value.length ? value : undefined,
  }
}

// Every question shown to the client, in the summary's order
function rowsFor(answers: BriefAnswers): BriefEmailRow[] {
  return briefSteps.flatMap((step) =>
    [step, ...visibleFollowUps(step, answers)].map((question) => rowFor(question, answers)),
  )
}

function answerHtml(row: BriefEmailRow) {
  if (row.links) {
    return row.links
      .map(({ url = '', note }) => {
        const link = `<a href="${escapeHtml(url)}" class="link" style="color:#000">${escapeHtml(url)}</a>`
        return note?.trim()
          ? `${link}<br><span class="muted" style="color:#666">${escapeHtml(note.trim())}</span>`
          : link
      })
      .join('<br><br>')
  }

  if (!row.answer) return '<em class="muted" style="color:#999">Skipped</em>'
  return escapeHtml(row.answer)
}

// Email clients want tables and inline styles. Colours are plain hex here: the site's tokens don't reach an inbox.
// `rows` is already HTML: table rows, each a cell.
// Dark mode is declared and styled here, or Apple Mail darkens the email by its own guess, which left the button's
// text dark on dark. Clients that ignore <style> (Gmail) keep the light email.
const layout = (rows: string) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
      :root { color-scheme: light dark; supported-color-schemes: light dark; }
      @media (prefers-color-scheme: dark) {
        .body { background: #000 !important; color: #fff !important; }
        .card { background: #1c1c1c !important; }
        .line { border-color: #333 !important; }
        .muted { color: #a3a3a3 !important; }
        .link { color: #fff !important; }
        .button { background: #fff !important; color: #000 !important; }
      }
    </style>
  </head>
  <body class="body" style="margin:0;padding:24px;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#000">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px">
      ${rows}
    </table>
  </body>
</html>`

const headingRow = (text: string) =>
  `<tr><td style="padding:32px 32px 8px;font-size:22px;line-height:1.3">${escapeHtml(text)}</td></tr>`

const paragraphRow = (html: string) =>
  `<tr><td style="padding:8px 32px;font-size:16px;line-height:1.5">${html}</td></tr>`

const footerRow = (text: string) =>
  `<tr><td class="line muted" style="padding:24px 32px 32px;border-top:1px solid #eee;font-size:13px;color:#666">${escapeHtml(text)}</td></tr>`

const answerRows = (rows: BriefEmailRow[]) =>
  rows
    .map(
      (row) => `<tr><td class="line" style="padding:16px 32px;border-top:1px solid #eee">
        <div class="muted" style="font-size:13px;line-height:1.4;color:#666">${escapeHtml(row.title)}</div>
        <div style="padding-top:6px;font-size:16px;line-height:1.5">${answerHtml(row)}</div>
      </td></tr>`,
    )
    .join('\n      ')

const answerText = (rows: BriefEmailRow[]) => rows.flatMap((row) => [row.title, row.answer ?? 'Skipped', ''])

// To the team, from a confirmed brief: every answer in the summary's order, and a reply goes to the client
export function briefTeamEmail(answers: BriefAnswers) {
  const rows = rowsFor(answers)
  const subject = `New brief: ${answers.name}, ${answers.business}`
  const footer = `Reply to this email to answer ${briefFirstName(answers) || 'them'} directly.`

  return {
    subject,
    text: [subject, '', ...answerText(rows), footer].join('\n'),
    html: layout(`${headingRow(subject)}\n      ${answerRows(rows)}\n      ${footerRow(footer)}`),
  }
}

// To the client, once they've confirmed: their answers, for their records
export function briefCopyEmail(answers: BriefAnswers) {
  const rows = rowsFor(answers)
  const name = briefFirstName(answers)
  const subject = 'We’ve got your brief'
  const intro = `Thanks${name ? `, ${name}` : ''}. Your brief has reached us, and we’ll reply within two working days to book a short call. Here’s a copy of what you sent. Got files to share, like brand guidelines or an old brief? Reply to this email with them attached.`
  const footer = 'ditta · hello@ditta.studio'

  return {
    subject,
    text: [subject, '', intro, '', ...answerText(rows), footer].join('\n'),
    html: layout(
      `${headingRow(subject)}\n      ${paragraphRow(escapeHtml(intro))}\n      ${answerRows(rows)}\n      ${footerRow(footer)}`,
    ),
  }
}

// To the client, when they send: the link that confirms the brief is theirs and sends it to the team
export function briefConfirmEmail(answers: Pick<BriefAnswers, 'name'>, link: string) {
  const name = briefFirstName(answers)
  const subject = 'Confirm and send your brief to ditta'
  const intro = `Hi${name ? ` ${name}` : ''}, click below to send us your brief. It only reaches us once you do.`
  const after = 'The link works for 72 hours. If you didn’t fill in a brief on ditta.studio, ignore this email.'

  const button = `<a href="${escapeHtml(link)}" class="button" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#000;color:#fff;font-weight:500;text-decoration:none">Confirm and send</a>`

  return {
    subject,
    text: [intro, '', `Confirm and send: ${link}`, '', after].join('\n'),
    html: layout(
      `${headingRow(subject)}\n      ${paragraphRow(escapeHtml(intro))}\n      <tr><td style="padding:16px 32px 24px">${button}</td></tr>\n      ${footerRow(after)}`,
    ),
  }
}
