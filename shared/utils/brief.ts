// Brief builder copy and display helpers, shared so the server writes the team email from the same questions.
// Validation lives in #shared/schemas/brief; the copy follows docs/plans/brief-builder-flow.md.
import type { BriefAnswersInput, BriefFieldKey, BriefFollowUpKey, BriefStepKey } from '#shared/schemas/brief'
import { briefFollowUps, briefOptions, hasValue, isBriefFieldRequired, isFollowUpShown } from '#shared/schemas/brief'

type BriefField = 'cards' | 'chips' | 'text' | 'email' | 'url' | 'links' | 'slider'
type BriefDraft = Partial<BriefAnswersInput>
type BriefLinkRow = NonNullable<BriefAnswersInput['references']>[number]

interface BriefFigure {
  figure: string
  unit: string
}

interface BriefQuestion {
  key: BriefFieldKey
  title: string
  hint?: string
  field: BriefField
  multiple?: boolean
  options?: readonly string[]
  // The option a slider starts on, chosen for them, rather than starting with nothing chosen
  initial?: string
  // A line under an option card's title, keyed by option
  descriptions?: Partial<Record<string, string>>
  // A big figure with its unit under it in place of an option card's title, keyed by option
  figures?: Partial<Record<string, BriefFigure>>
  placeholder?: string
  // Shown in turn in place of `placeholder`, for a question that's easier to answer with a few ideas to go on
  placeholders?: readonly string[]
  autocomplete?: string
  // Link rows: the note field's placeholder
  notePlaceholder?: string
  // Link rows: a reminder under links from hosts that are private until shared
  sharingNudge?: boolean
}

interface BriefStep extends BriefQuestion {
  key: BriefStepKey
}

const briefSteps: BriefStep[] = [
  {
    key: 'services',
    title: 'What do you need help with?',
    hint: 'Select all that apply',
    field: 'cards',
    multiple: true,
    options: briefOptions.services,
    descriptions: {
      'Web Design': 'Planning, organising, and building the visual and interactive layers of a website.',
      'Web Build': 'Planning, organising, and building the website based on a design.',
      'Existing project': "You have something already that you'd like us to look at.",
      Other: 'Anything else that might not be covered here.',
    },
  },
  {
    key: 'business',
    title: 'In a few words, what does your business do?',
    hint: 'Give us your best elevator pitch 🛗',
    field: 'text',
    placeholders: [
      'A physio clinic in Ealing',
      'An architect in Bristol',
      'Handmade ceramics',
      'A hotel in the Cotswolds',
      'Software for accountants',
    ],
  },
  {
    key: 'objectives',
    title: 'What are the main objectives for this work?',
    hint: 'Pick what matters most.',
    field: 'cards',
    multiple: true,
    options: briefOptions.objectives,
  },
  {
    key: 'timing',
    title: 'When would you like your project ready?',
    field: 'cards',
    options: briefOptions.timing,
    figures: {
      ASAP: { figure: 'ASAP', unit: 'right away' },
      '3 months': { figure: '3', unit: 'months' },
      '6 months': { figure: '6', unit: 'months' },
      Other: { figure: 'Other', unit: 'something else' },
    },
  },
  {
    key: 'references',
    title: 'Who are the main competitors in your space?',
    hint: 'Links and comments to companies you admire',
    field: 'links',
  },
  {
    // Links only for now: uploads are M6 (docs/plans/brief-builder-milestones.md)
    key: 'files',
    title: "Is there anything you'd like to share?",
    hint: 'Designs, brand guidelines, a brief — anything that helps.',
    field: 'links',
    // Rests on the first, which is also what screen readers hear
    placeholders: ['Paste a link', 'figma.com/design/…', 'drive.google.com/…', 'docs.google.com/…', 'dropbox.com/…'],
    notePlaceholder: 'What is this? (optional)',
    sharingNudge: true,
  },
  {
    key: 'contentStage',
    title: 'At what stage is your content?',
    hint: 'Things like your about text, service descriptions and photos.',
    field: 'cards',
    options: briefOptions.contentStage,
  },
  {
    key: 'budget',
    title: 'What budget do you have available?',
    hint: 'Most of our projects are between £10k and £20k.',
    field: 'slider',
    options: briefOptions.budget,
    initial: '£10k–£20k',
  },
  {
    key: 'name',
    title: "What's your full name?",
    field: 'text',
    autocomplete: 'name',
  },
  {
    key: 'website',
    title: 'And your current website, [name]?',
    hint: "Skip if you don't have one yet.",
    field: 'url',
    placeholder: 'acme.com',
    autocomplete: 'url',
  },
  {
    key: 'source',
    title: 'How did you find us?',
    field: 'chips',
    options: briefOptions.source,
  },
  {
    key: 'email',
    title: "And finally, what's your email?",
    hint: 'So we can reply about your project.',
    field: 'email',
    autocomplete: 'email',
  },
]

// When each follow-up shows is in the shared schema; only its wording lives here
const briefFollowUpCopy: Record<BriefFollowUpKey, Omit<BriefQuestion, 'key'>> = {
  servicesOther: { title: 'What else can we help with?', field: 'text' },
  productCount: {
    title: 'Roughly how many products?',
    field: 'slider',
    options: briefOptions.productCount,
    initial: 'Under 10',
  },
  objectivesOther: { title: 'What else can we help with?', field: 'text' },
  timingOther: { title: 'Let us know your ideal timing', field: 'text' },
  contentOther: { title: 'Clarify its current state', field: 'text' },
  sourceOther: { title: 'Let us know how you found us', field: 'text' },
}

const visibleFollowUps = (step: BriefStep, answers: BriefDraft): BriefQuestion[] =>
  briefFollowUps
    .filter((followUp) => followUp.parent === step.key && isFollowUpShown(followUp, answers))
    .map((followUp) => ({ key: followUp.key, ...briefFollowUpCopy[followUp.key] }))

// Display only (Skip label, summary). Whether an answer is *valid* is the schema's call.
// A list counts once it has a choice, or a link row with a link in it.
const hasBriefAnswer = (value: unknown): boolean =>
  Array.isArray(value)
    ? value.some((item) => (typeof item === 'string' ? true : !!(item as BriefLinkRow).url?.trim()))
    : hasValue(value)

const isBriefStepRequired = (step: BriefStep) => isBriefFieldRequired(step.key)

const briefFirstName = (answers: BriefDraft) => answers.name?.trim().split(/\s+/)[0] ?? ''

// `[name]` becomes the first name, or `, [name]` is dropped when there isn't one yet
const personaliseBrief = (title: string, answers: BriefDraft) => {
  const name = briefFirstName(answers)
  return name ? title.replace('[name]', name) : title.replace(/,?\s*\[name\]/, '')
}

const formatBriefAnswer = (value: unknown): string | null => {
  if (!hasBriefAnswer(value)) return null
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) {
    return value
      .map((item: string | BriefLinkRow) => {
        if (typeof item === 'string') return item
        const url = item.url?.trim()
        const note = item.note?.trim()
        return url ? (note ? `${url} (${note})` : url) : ''
      })
      .filter(Boolean)
      .join(', ')
  }

  return String(value)
}

// Hosts where a pasted link is often private until its owner shares it
const briefPrivateHosts = [
  'drive.google.com',
  'docs.google.com',
  'dropbox.com',
  'onedrive.live.com',
  '1drv.ms',
  'sharepoint.com',
  'figma.com',
]

const isPrivateByDefault = (url: string) => {
  const value = url.trim()
  if (!value) return false

  try {
    const { hostname } = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    return briefPrivateHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

// A light "did you mean" for the commonest email domain typos
const briefEmailDomains: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'icloud.co': 'icloud.com',
  'iclod.com': 'icloud.com',
}

const suggestBriefEmail = (email: string): string | null => {
  const [local, domain] = email.trim().toLowerCase().split('@')
  const fix = domain ? briefEmailDomains[domain] : undefined
  return local && fix ? `${local}@${fix}` : null
}

export type { BriefDraft, BriefField, BriefFigure, BriefLinkRow, BriefQuestion, BriefStep }
export {
  briefFirstName,
  briefSteps,
  formatBriefAnswer,
  hasBriefAnswer,
  isBriefStepRequired,
  isPrivateByDefault,
  personaliseBrief,
  suggestBriefEmail,
  visibleFollowUps,
}
