// Brief builder questions and the pure logic around them. The copy follows docs/plans/brief-builder-flow.md.

type BriefField = 'cards' | 'chips' | 'text' | 'email' | 'url' | 'links' | 'slider'

interface BriefLink {
  url: string
  note: string
}

type BriefAnswer = string | string[] | BriefLink[]
type BriefAnswers = Partial<Record<string, BriefAnswer>>

interface BriefQuestion {
  key: string
  title: string
  hint?: string
  field: BriefField
  multiple?: boolean
  options?: string[]
  placeholder?: string
  autocomplete?: string
}

interface BriefFollowUp extends BriefQuestion {
  // Shown while the parent's answer is, or includes, this option. Required while shown.
  showsWhen: string
}

interface BriefStep extends BriefQuestion {
  required: boolean
  followUps?: BriefFollowUp[]
}

const briefSteps: BriefStep[] = [
  {
    key: 'services',
    title: 'What do you need help with?',
    hint: 'Select all that apply.',
    field: 'cards',
    multiple: true,
    required: true,
    options: ['Web Design', 'Web Build', 'Existing project', 'Other'],
    followUps: [{ key: 'servicesOther', title: 'What else can we help with?', field: 'text', showsWhen: 'Other' }],
  },
  {
    key: 'business',
    title: 'In a few words, what does your business do?',
    hint: 'Give us your best elevator pitch 🛗',
    field: 'text',
    required: true,
    placeholder: 'A physio clinic in Ealing',
  },
  {
    key: 'objectives',
    title: 'What are the main objectives for this work?',
    hint: 'Pick what matters most.',
    field: 'cards',
    multiple: true,
    required: true,
    options: [
      'Showcase our work',
      'Improve SEO/GEO',
      'Increase enquiries',
      'Take bookings',
      'Sell online',
      'Explain what we do',
      'Bespoke functionality',
      'Other',
    ],
    followUps: [
      {
        key: 'productCount',
        title: 'Roughly how many products?',
        field: 'slider',
        showsWhen: 'Sell online',
        options: ['Under 10', '10–50', '50–200', '200–1000', '1000+'],
      },
      { key: 'objectivesOther', title: 'What else can we help with?', field: 'text', showsWhen: 'Other' },
    ],
  },
  {
    key: 'timing',
    title: 'When would you like your project ready?',
    field: 'cards',
    required: true,
    options: ['ASAP', '3 months', '6 months', 'Other'],
    followUps: [{ key: 'timingOther', title: 'Let us know your ideal timing', field: 'text', showsWhen: 'Other' }],
  },
  {
    key: 'references',
    title: 'Who are the main competitors in your space?',
    hint: 'Links and comments to companies you admire',
    field: 'links',
    required: false,
  },
  {
    // Link-only for v1: uploads are M6 (docs/plans/brief-builder-milestones.md)
    key: 'files',
    title: "Is there anything you'd like to share?",
    hint: 'Designs, brand guidelines or a working brief.',
    field: 'url',
    required: false,
    placeholder: 'Paste a Figma or design link',
  },
  {
    key: 'contentStage',
    title: 'At what stage is your content?',
    hint: 'Things like your about text, service descriptions and photos.',
    field: 'cards',
    required: true,
    options: ['Ready to go', 'Partially ready', 'Not ready', 'Other'],
    followUps: [{ key: 'contentOther', title: 'Clarify its current state', field: 'text', showsWhen: 'Other' }],
  },
  {
    key: 'budget',
    title: 'What budget do you have available?',
    hint: 'Most of our projects are between £X and £Y.',
    field: 'slider',
    required: true,
    options: ['Under £5k', '£5k–£10k', '£10k–£20k', '£20k–£40k', '£40k+'],
  },
  {
    key: 'name',
    title: "What's your full name?",
    field: 'text',
    required: true,
    autocomplete: 'name',
  },
  {
    key: 'website',
    title: 'And your current website, [name]?',
    hint: "Skip if you don't have one yet.",
    field: 'url',
    required: false,
    placeholder: 'https://',
    autocomplete: 'url',
  },
  {
    key: 'source',
    title: 'How did you find us?',
    field: 'chips',
    required: false,
    options: ['Google', 'Instagram', 'LinkedIn', 'ChatGPT', 'Claude', 'Referral', 'From a website you made', 'Other'],
    followUps: [{ key: 'sourceOther', title: 'Let us know how you found us', field: 'text', showsWhen: 'Other' }],
  },
  {
    key: 'email',
    title: "And finally, what's your email?",
    hint: "We'll send you a copy of your brief.",
    field: 'email',
    required: true,
    autocomplete: 'email',
  },
]

const isBriefLinks = (value: BriefAnswer): value is BriefLink[] =>
  Array.isArray(value) && value.some((item) => typeof item === 'object')

const briefLinks = (value: BriefAnswer | undefined): BriefLink[] =>
  value && isBriefLinks(value) ? value.filter((link) => link.url.trim()) : []

const isBriefAnswered = (value: BriefAnswer | undefined): boolean => {
  if (value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (isBriefLinks(value)) return briefLinks(value).length > 0

  return value.length > 0
}

const isBriefEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

const isFollowUpVisible = (followUp: BriefFollowUp, parent: BriefAnswer | undefined) =>
  Array.isArray(parent) ? (parent as string[]).includes(followUp.showsWhen) : parent === followUp.showsWhen

const visibleFollowUps = (step: BriefStep, answers: BriefAnswers) =>
  step.followUps?.filter((followUp) => isFollowUpVisible(followUp, answers[step.key])) ?? []

// An error message when the step can't be left yet, or null when it can
const briefStepError = (step: BriefStep, answers: BriefAnswers): string | null => {
  const value = answers[step.key]

  if (step.required && !isBriefAnswered(value)) return 'Answer to continue'
  if (step.field === 'email' && typeof value === 'string' && value.trim() && !isBriefEmail(value)) {
    return 'Enter a valid email'
  }
  if (visibleFollowUps(step, answers).some((followUp) => !isBriefAnswered(answers[followUp.key]))) {
    return 'Answer to continue'
  }

  return null
}

const briefFirstName = (answers: BriefAnswers) => {
  const name = answers.name
  return typeof name === 'string' ? (name.trim().split(/\s+/)[0] ?? '') : ''
}

// `[name]` becomes the first name, or `, [name]` is dropped when there isn't one yet
const personaliseBrief = (title: string, answers: BriefAnswers) => {
  const name = briefFirstName(answers)
  return name ? title.replace('[name]', name) : title.replace(/,?\s*\[name\]/, '')
}

const formatBriefAnswer = (value: BriefAnswer | undefined): string | null => {
  if (!value || !isBriefAnswered(value)) return null
  if (typeof value === 'string') return value.trim()
  if (isBriefLinks(value)) {
    return briefLinks(value)
      .map(({ url, note }) => (note.trim() ? `${url.trim()} (${note.trim()})` : url.trim()))
      .join(', ')
  }

  return (value as string[]).join(', ')
}

// What would be submitted: every step's answer plus only the follow-ups still showing
const visibleBriefAnswers = (answers: BriefAnswers): BriefAnswers => {
  const result: BriefAnswers = {}

  for (const step of briefSteps) {
    for (const question of [step, ...visibleFollowUps(step, answers)]) {
      const value = answers[question.key]
      if (isBriefAnswered(value)) result[question.key] = isBriefLinks(value!) ? briefLinks(value) : value
    }
  }

  return result
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

export type { BriefAnswer, BriefAnswers, BriefField, BriefFollowUp, BriefLink, BriefQuestion, BriefStep }
export {
  briefFirstName,
  briefLinks,
  briefStepError,
  briefSteps,
  formatBriefAnswer,
  isBriefAnswered,
  isFollowUpVisible,
  personaliseBrief,
  suggestBriefEmail,
  visibleBriefAnswers,
  visibleFollowUps,
}
