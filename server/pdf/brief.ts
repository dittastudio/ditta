// The confirmed brief as a printable A4 page, rendered to PDF by Cloudflare Browser Run (M5 in
// docs/plans/brief-builder-milestones.md). Light and minimal: the logo, the brief at a glance, then every answer in
// the summary's order. The font and logo are embedded (nuxt.config.ts → serverAssets), so nothing is fetched.
import type { BriefAnswers } from '#shared/schemas/brief'
import type { BriefEmailRow } from '../emails/brief'
import { escapeHtml, rowFor } from '../emails/brief'

export interface BriefPdfMeta {
  id: string
  confirmedAt: number
}

// The brief's reference, as the team would say it: the start of its id
export const briefReference = (id: string) => id.slice(0, 8).toUpperCase()

export const toBase64 = (bytes: Uint8Array) => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

async function assets() {
  const font = await useStorage('assets:fonts').getItemRaw<Uint8Array>('SaansVF.woff2')
  const logo = await useStorage('assets:icons').getItem<string>('ditta.svg')
  if (!font || !logo) throw new Error('Brief PDF assets missing')
  return { font: toBase64(new Uint8Array(font)), logo: String(logo) }
}

const answerHtml = (row: BriefEmailRow) => {
  if (row.links) {
    return row.links
      .map(
        ({ url = '', note }) =>
          `<span class="link">${escapeHtml(url)}</span>${note?.trim() ? `<span class="note">${escapeHtml(note.trim())}</span>` : ''}`,
      )
      .join('')
  }
  return row.answer ? escapeHtml(row.answer) : '<span class="skipped">Skipped</span>'
}

// At a glance stays at a glance: a long answer is cut short here, and is there in full in the brief below
const GLANCE_MAX = 60
const clip = (value: string) => (value.length > GLANCE_MAX ? `${value.slice(0, GLANCE_MAX - 1).trimEnd()}…` : value)

const fact = (label: string, value: string | null | undefined) =>
  `<div class="fact"><dt>${label}</dt><dd>${value ? escapeHtml(clip(value)) : '<span class="skipped">Not given</span>'}</dd></div>`

export async function briefPdfHtml(answers: BriefAnswers, meta: BriefPdfMeta) {
  const { font, logo } = await assets()
  // One row per step, as the form numbers them, with any follow-up it opened inside it
  const steps = briefSteps.map((step) => ({
    row: rowFor(step, answers),
    followUps: visibleFollowUps(step, answers).map((followUp) => rowFor(followUp, answers)),
  }))
  const reference = briefReference(meta.id)
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    meta.confirmedAt,
  )
  const contact = [answers.email, answers.website?.replace(/^https?:\/\//, '')].filter(Boolean).join('\n')
  // "Other" says less than what was written for it
  const services = answers.services
    .map((service) => (service === 'Other' && answers.servicesOther ? answers.servicesOther : service))
    .join(', ')
  const timing = answers.timing === 'Other' && answers.timingOther ? answers.timingOther : answers.timing

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>Project brief ${reference}: ${escapeHtml(answers.name)}</title>
<style>
  @font-face {
    font-family: Saans;
    font-weight: 300 900;
    src: url(data:font/woff2;base64,${font}) format('woff2');
  }

  /* The site's tokens (app/assets/css/app.css @theme), for print: Tailwind doesn't reach this page */
  :root {
    --color-white: oklch(100% 0 0);
    --color-black: oklch(0% 0 0);
    --color-grey: oklch(97.315% 0 0);
    --color-putty: oklch(90.72% 0.0017 67.8);
    --color-charcoal: oklch(29.72% 0 0);
    --color-accent: oklch(0.8221 0.1207 348.4);
    --muted: color-mix(in oklab, var(--color-black) 50%, transparent);
  }

  @page {
    size: A4;
    margin: 18mm 18mm 22mm;

    @bottom-left {
      content: 'ditta · hello@ditta.studio · ditta.studio';
      font: 400 7.5pt Saans, sans-serif;
      color: oklch(55% 0 0);
      vertical-align: top;
      padding-top: 6mm;
    }

    @bottom-right {
      content: 'Brief ${reference} · ' counter(page) ' of ' counter(pages);
      font: 400 7.5pt Saans, sans-serif;
      color: oklch(55% 0 0);
      vertical-align: top;
      padding-top: 6mm;
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* Only for looking at it in a browser (server/routes/_dev/brief-pdf.get.ts): the page as a sheet of A4 */
  @media screen {
    html { background: var(--color-putty); }
    body { width: 210mm; min-height: 297mm; margin: 10mm auto; padding: 18mm; background: var(--color-white); }
  }

  html {
    font-family: Saans, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    color: var(--color-black);
    background: var(--color-white);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 14mm;
  }

  header svg { height: 7mm; width: auto; fill: var(--color-black); }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 2.5mm;
    font-size: 8pt;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }

  header .eyebrow::before {
    content: '';
    width: 2mm;
    height: 2mm;
    border-radius: 50%;
    background: var(--color-accent);
  }

  h1 {
    max-width: 150mm;
    padding-top: 5mm;
    font-size: 30pt;
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }

  /* A business described at length still fits the top of the first page */
  h1.long { font-size: 20pt; line-height: 1.15; }

  .from {
    padding-top: 5mm;
    font-size: 11pt;
    color: var(--muted);
  }

  .from strong { font-weight: 500; color: var(--color-black); }

  .glance {
    display: grid;
    /* Contact gets the most room: an address shouldn't break mid-word */
    grid-template-columns: 1.1fr 0.8fr 1fr 1.5fr;
    gap: 6mm;
    margin-top: 12mm;
    padding: 6mm;
    border-radius: 10px;
    background: var(--color-grey);
    break-inside: avoid;
  }

  .fact dt {
    font-size: 7.5pt;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .fact dd {
    padding-top: 1.5mm;
    font-size: 10pt;
    white-space: pre-line;
    overflow-wrap: break-word;
  }

  h2 {
    padding: 14mm 0 4mm;
    font-size: 8pt;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
    break-after: avoid;
  }

  ol { list-style: none; border-bottom: 0.5pt solid var(--color-putty); }

  li {
    display: grid;
    grid-template-columns: 9mm 1fr;
    padding: 4mm 0;
    border-top: 0.5pt solid var(--color-putty);
    break-inside: avoid;
  }

  .number {
    font-size: 8pt;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    padding-top: 0.6mm;
  }

  .question { font-size: 8.5pt; color: var(--muted); }

  .answer {
    padding-top: 1.2mm;
    font-size: 11pt;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  /* A follow-up sits under the answer that opened it, as it did in the form */
  .follow-up {
    margin-top: 3mm;
    padding-left: 3.5mm;
    border-left: 1.5pt solid var(--color-putty);
  }

  .link { display: block; }
  .link + .note { display: block; padding-bottom: 1.5mm; font-size: 9pt; color: var(--muted); }
  .skipped { color: var(--muted); font-style: italic; }
</style>
</head>
<body>
  <header>
    ${logo}
    <p class="eyebrow">Project brief</p>
  </header>

  <p class="eyebrow">${date} · Brief ${reference}</p>
  <h1${answers.business.length > 80 ? ' class="long"' : ''}>${escapeHtml(answers.business)}</h1>
  <p class="from">From <strong>${escapeHtml(answers.name)}</strong></p>

  <dl class="glance">
    ${fact('Services', services)}
    ${fact('Budget', answers.budget)}
    ${fact('Timing', timing)}
    ${fact('Contact', contact)}
  </dl>

  <h2>The brief</h2>
  <ol>
    ${steps
      .map(
        ({ row, followUps }, index) => `<li>
      <span class="number">${String(index + 1).padStart(2, '0')}</span>
      <div>
        <p class="question">${escapeHtml(row.title)}</p>
        <p class="answer">${answerHtml(row)}</p>
        ${followUps
          .map(
            (followUp) => `<div class="follow-up">
          <p class="question">${escapeHtml(followUp.title)}</p>
          <p class="answer">${answerHtml(followUp)}</p>
        </div>`,
          )
          .join('')}
      </div>
    </li>`,
      )
      .join('\n    ')}
  </ol>
</body>
</html>`
}
