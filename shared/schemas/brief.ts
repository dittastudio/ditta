// The brief builder's validation, shared by the form (Regle) and, from M3, the API routes.
// See "Validation — Regle + Zod" in docs/plans/brief-builder.md.
import { z } from 'zod'

const REQUIRED = 'Answer to continue'
const TOO_LONG = 'Keep it under 200 characters'

export const briefOptions = {
  services: ['Web Design', 'Web Build', 'Existing project', 'Other'],
  objectives: [
    'Showcase work',
    'Improve SEO/GEO',
    'Increase enquiries',
    'Take bookings',
    'Sell online',
    'Explain what we do',
    'Bespoke functionality',
    'Other',
  ],
  productCount: ['Under 10', '10–50', '50–200', '200–1000', '1000+'],
  timing: ['ASAP', '3 months', '6 months', 'Other'],
  contentStage: ['Ready to go', 'Partially ready', 'Not ready', 'Other'],
  budget: ['Under £5k', '£5k–£10k', '£10k–£20k', '£20k–£40k', '£40k+'],
  source: ['Google', 'Instagram', 'LinkedIn', 'ChatGPT', 'Claude', 'Referral', 'From a website you made', 'Other'],
} as const

const text = z.string({ error: REQUIRED }).trim().min(1, REQUIRED).max(200, TOO_LONG)
const optionalText = z.string().trim().max(200, TOO_LONG).optional()

// "acme.com" is accepted and stored as "https://acme.com". An empty field is fine; optional is optional.
const optionalLink = z
  .string()
  .trim()
  .transform((value) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value))
  .pipe(
    z.union([z.literal(''), z.url({ protocol: /^https?$/, hostname: z.regexes.domain, error: 'Enter a valid link' })]),
  )
  .optional()

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
  references: z
    .array(z.object({ url: optionalLink, note: optionalText }))
    .max(3, 'Up to 3 links')
    .optional()
    .transform((rows) => rows?.filter((row) => row.url)),
  files: optionalLink,
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

const hasValue = (value: unknown) => (typeof value === 'string' ? value.trim() !== '' : value != null)

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

// Whether a question must be answered, read off its schema rather than declared twice
export const isBriefFieldRequired = (key: BriefFieldKey) => !briefFields[key].safeParse(undefined).success

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
