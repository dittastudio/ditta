import { briefPdfHtml } from '../pdf/brief'
import { briefAnswersSchema } from '#shared/schemas/brief'

// /_dev/brief-pdf, dev only (nuxt.config.ts → $development): the brief PDF's HTML for a sample brief, to design it in the browser (print preview shows the pages).
// ?long fills every answer to its limit, to check how it paginates.
export default defineEventHandler(async (event) => {
  const long = getQuery(event).long !== undefined
  const pad = (text: string) => (long ? `${text} `.repeat(20).slice(0, 199).trim() : text)

  const answers = briefAnswersSchema.parse({
    services: ['Web Design', 'Web Build', 'Other'],
    servicesOther: pad('A brand refresh to go with the new site'),
    business: pad('Independent coffee roaster in Hackney, selling beans online and to cafés'),
    objectives: ['Sell online', 'Explain what we do', 'Update the site ourselves', 'Other'],
    objectivesOther: pad('Take wholesale orders without the back and forth by email'),
    productCount: '10–50',
    timing: 'Other',
    timingOther: pad('Before the spring coffee festival in April'),
    references: [
      { url: 'https://example.com/roaster', note: pad('Love how simple the shop is') },
      { url: 'https://example.org/coffee', note: '' },
    ],
    files: [{ url: 'https://drive.example.com/brand-guidelines', note: pad('Brand guidelines and logo files') }],
    contentStage: 'Partially ready',
    budget: '£10k–£20k',
    name: 'Sam Taylor',
    website: 'samtaylorcoffee.co.uk',
    source: 'Referral',
    email: 'sam@samtaylorcoffee.co.uk',
  })

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return briefPdfHtml(answers, { id: 'a1962566-4344-4691-a5aa-4a15b26a3f79', confirmedAt: Date.now() })
})
