// The brief builder's validation, shared by the form (Regle) and the API route (server/api/brief/index.post.ts).
// See "Validation — Regle + Zod" in docs/plans/brief-builder.md.
import { z } from 'zod'

// The inputs cap typing at the same lengths. Links get far more room: share and signed links run long, and one cut
// short still looks valid but leads nowhere.
export const BRIEF_TEXT_MAX = 200
export const BRIEF_LINK_MAX = 2048

const REQUIRED = 'Answer to continue'
const TOO_LONG = `Keep it under ${BRIEF_TEXT_MAX} characters`

export const briefOptions = {
  services: ['Web Design', 'Web Build', 'Existing project', 'Other'],
  objectives: [
    'Improve SEO/GEO',
    'AI integration',
    'Drive traffic',
    'Increase sales',
    'Sell online',
    'Show off our best work',
    'Explain what we do',
    'Update the site ourselves',
    'Automate admin',
    'Bespoke functionality',
    'Other',
  ],
  productCount: ['Under 10', '10–50', '50–200', '200–1000', '1000+'],
  timing: ['ASAP', '3 months', '6 months', 'Other'],
  contentStage: ['Ready to go', 'Partially ready', 'Not ready', 'Other'],
  budget: ['Under £5k', '£5k–£10k', '£10k–£20k', '£20k–£40k', '£40k+'],
  source: ['Google', 'Instagram', 'LinkedIn', 'ChatGPT', 'Claude', 'Referral', 'Your work', 'Other'],
} as const

const text = z.string({ error: REQUIRED }).trim().min(1, REQUIRED).max(BRIEF_TEXT_MAX, TOO_LONG)
const optionalText = z.string().trim().max(BRIEF_TEXT_MAX, TOO_LONG).optional()

// "acme.com" is accepted and stored as "https://acme.com". An empty field is fine; optional is optional.
const optionalLink = z
  .string()
  .trim()
  .max(BRIEF_LINK_MAX, 'That link is too long')
  .transform((value) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value))
  .pipe(
    z.union([z.literal(''), z.url({ protocol: /^https?$/, hostname: z.regexes.domain, error: 'Enter a valid link' })]),
  )
  .optional()

// How many link rows each links field takes, for the schema to enforce and the field to stop adding at
export const briefLinkLimits = { references: 5, files: 3 } as const

// Up to `max` link rows, each with an optional note. Rows left without a link are dropped.
const linkRows = (max: number) =>
  z
    .array(z.object({ url: optionalLink, note: optionalText }))
    .max(max, `Up to ${max} links`)
    .optional()
    .transform((rows) => rows?.filter((row) => row.url))

const pickOne = <T extends readonly [string, ...string[]]>(options: T) => z.enum(options, { error: REQUIRED })
const pickSome = <T extends readonly [string, ...string[]]>(options: T) =>
  z.array(z.enum(options), { error: REQUIRED }).min(1, REQUIRED)

// Every answer the brief can hold. Follow-ups are optional here and required only while shown (below).
const briefFields = {
  services: pickSome(briefOptions.services),
  servicesOther: optionalText,
  business: text,
  objectives: pickSome(briefOptions.objectives),
  productCount: z.enum(briefOptions.productCount).optional(),
  objectivesOther: optionalText,
  timing: pickOne(briefOptions.timing),
  timingOther: optionalText,
  references: linkRows(briefLinkLimits.references),
  files: linkRows(briefLinkLimits.files),
  contentStage: pickOne(briefOptions.contentStage),
  contentOther: optionalText,
  budget: pickOne(briefOptions.budget),
  name: text,
  website: optionalLink,
  source: z.enum(briefOptions.source).optional(),
  sourceOther: optionalText,
  email: z
    .string({ error: REQUIRED })
    .trim()
    .min(1, REQUIRED)
    .max(BRIEF_TEXT_MAX, TOO_LONG)
    .pipe(z.email({ error: 'Enter a valid email' })),
}

export type BriefFieldKey = keyof typeof briefFields

export const briefStepKeys = [
  'services',
  'business',
  'objectives',
  'timing',
  'references',
  'files',
  'contentStage',
  'budget',
  'name',
  'website',
  'source',
  'email',
] as const satisfies BriefFieldKey[]

export type BriefStepKey = (typeof briefStepKeys)[number]

interface BriefFollowUpRule {
  key: BriefFieldKey
  parent: BriefStepKey
  showsWhen: string
}

// A follow-up shows while its parent's answer is, or includes, `showsWhen`
export const briefFollowUps = [
  { key: 'servicesOther', parent: 'services', showsWhen: 'Other' },
  { key: 'productCount', parent: 'objectives', showsWhen: 'Sell online' },
  { key: 'objectivesOther', parent: 'objectives', showsWhen: 'Other' },
  { key: 'timingOther', parent: 'timing', showsWhen: 'Other' },
  { key: 'contentOther', parent: 'contentStage', showsWhen: 'Other' },
  { key: 'sourceOther', parent: 'source', showsWhen: 'Other' },
] as const satisfies BriefFollowUpRule[]

export type BriefFollowUpKey = (typeof briefFollowUps)[number]['key']

type LooseAnswers = Partial<Record<string, unknown>>

export const isFollowUpShown = (followUp: BriefFollowUpRule, answers: LooseAnswers) => {
  const parent = answers[followUp.parent]
  return Array.isArray(parent) ? parent.includes(followUp.showsWhen) : parent === followUp.showsWhen
}

// Whether a single answer has been given: a string with something in it, or anything else that's set
export const hasValue = (value: unknown) => (typeof value === 'string' ? value.trim() !== '' : value != null)

const requireShownFollowUps =
  (followUps: readonly BriefFollowUpRule[]) => (answers: LooseAnswers, ctx: z.RefinementCtx) => {
    for (const followUp of followUps) {
      if (isFollowUpShown(followUp, answers) && !hasValue(answers[followUp.key])) {
        ctx.addIssue({ code: 'custom', path: [followUp.key], message: REQUIRED })
      }
    }
  }

// Answers left behind in a follow-up that's no longer shown (ticked Other, typed, unticked) are dropped
export const stripHiddenFollowUps = <T extends LooseAnswers>(answers: T): T => {
  const result = { ...answers }
  for (const followUp of briefFollowUps) {
    if (!isFollowUpShown(followUp, answers)) delete result[followUp.key]
  }
  return result
}

// Whether a question must be answered, read off its schema rather than declared twice. Worked out once, up front.
const requiredFields = new Set(
  (Object.keys(briefFields) as BriefFieldKey[]).filter((key) => !briefFields[key].safeParse(undefined).success),
)

export const isBriefFieldRequired = (key: BriefFieldKey) => requiredFields.has(key)

const pickFields = (keys: BriefFieldKey[]) => Object.fromEntries(keys.map((key) => [key, briefFields[key]]))

// One schema per screen: its question plus that question's follow-ups. Next validates only these.
export const briefStepSchemas = Object.fromEntries(
  briefStepKeys.map((key) => {
    const followUps = briefFollowUps.filter((followUp) => followUp.parent === key)
    const schema = z
      .object(pickFields([key, ...followUps.map((followUp) => followUp.key)]))
      .superRefine(requireShownFollowUps(followUps))

    return [key, schema]
  }),
) as Record<BriefStepKey, z.ZodObject>

// The whole brief: what the summary checks before sending, and the stored `answers` JSON
export const briefAnswersSchema = z
  .object(briefFields)
  .superRefine(requireShownFollowUps(briefFollowUps))
  .transform(stripHiddenFollowUps)

export type BriefAnswersInput = z.input<typeof briefAnswersSchema>
export type BriefAnswers = z.output<typeof briefAnswersSchema>

// The body of POST /api/brief. The spam checks on `elapsed`, `honeypot` and `turnstileToken` are the route's.
export const briefSubmitSchema = z.object({
  // A brief this browser already sent and hasn't confirmed, sent again after an edit. Updated rather than duplicated.
  id: z.uuid().optional(),
  answers: briefAnswersSchema,
  // Milliseconds from the first answer to Send brief
  elapsed: z.number().int().nonnegative(),
  // A field people never see, so anything in it was typed by a bot
  honeypot: z.string().max(200).optional(),
  turnstileToken: z.string().max(2048),
})

export type BriefSubmitInput = z.input<typeof briefSubmitSchema>

// The body of POST /api/brief/:id/resend, from "Not received your email?": the address, perhaps with a typo fixed
export const briefResendSchema = z.object({ email: briefFields.email })

export type BriefResendInput = z.input<typeof briefResendSchema>

// The email link's token, for the confirm page's GET and POST, and for asking for a fresh link once it's expired
export const briefTokenSchema = z.object({ token: z.string().min(1).max(100) })

// What an email link leads to, for the confirm page. A link replaced by a resend, or for a brief that's been deleted,
// is invalid; nothing more is said about it.
export type BriefLinkState =
  | { state: 'invalid' }
  | { state: 'expired' }
  | { state: 'pending'; id: string; name: string; email: string; business: string }
  | { state: 'confirmed'; id: string; name: string; confirmedAt: number }
