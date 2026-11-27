import { describe, expect, test } from 'vitest'
import { briefAnswersSchema, briefStepSchemas, briefSubmitSchema, isBriefFieldRequired } from '#shared/schemas/brief'
import { completeAnswers } from './fixtures'

const issuesOf = (value: unknown) =>
  briefAnswersSchema.safeParse(value).error?.issues.map((issue) => [issue.path.join('.'), issue.message]) ?? []

describe('briefAnswersSchema', () => {
  test('takes a brief with every required answer', () => {
    expect(briefAnswersSchema.safeParse(completeAnswers()).success).toBe(true)
  })

  test('asks for each required answer', () => {
    const { business: _, ...answers } = completeAnswers()
    expect(issuesOf(answers)).toEqual([['business', 'Answer to continue']])
    expect(issuesOf({ ...completeAnswers(), services: [] })).toEqual([['services', 'Answer to continue']])
    expect(issuesOf({ ...completeAnswers(), name: '   ' })).toEqual([['name', 'Answer to continue']])
  })

  test('requires a follow-up only while it shows', () => {
    expect(issuesOf({ ...completeAnswers(), services: ['Web Design', 'Other'] })).toEqual([
      ['servicesOther', 'Answer to continue'],
    ])
    expect(issuesOf({ ...completeAnswers(), timing: 'Other', timingOther: 'By April' })).toEqual([])
  })

  test('drops answers left in a follow-up that no longer shows', () => {
    const parsed = briefAnswersSchema.parse({
      ...completeAnswers(),
      servicesOther: 'Left behind',
      objectives: ['Explain what we do'],
      productCount: '10–50',
    })
    expect(parsed).not.toHaveProperty('servicesOther')
    expect(parsed).not.toHaveProperty('productCount')
  })

  test('keeps a follow-up that shows', () => {
    const parsed = briefAnswersSchema.parse({
      ...completeAnswers(),
      objectives: ['Sell online'],
      productCount: '10–50',
    })
    expect(parsed.productCount).toBe('10–50')
  })

  test('takes a bare domain as a link, and turns away anything else', () => {
    expect(briefAnswersSchema.parse({ ...completeAnswers(), website: 'acme.com' }).website).toBe('https://acme.com')
    expect(briefAnswersSchema.parse({ ...completeAnswers(), website: '' }).website).toBe('')
    expect(issuesOf({ ...completeAnswers(), website: 'not a link' })).toEqual([['website', 'Enter a valid link']])
    expect(issuesOf({ ...completeAnswers(), website: 'ftp://acme.com' })).toEqual([['website', 'Enter a valid link']])
  })

  test('drops link rows without a link, and caps how many there are', () => {
    const parsed = briefAnswersSchema.parse({
      ...completeAnswers(),
      references: [
        { url: 'acme.com', note: 'Nice shop' },
        { url: '', note: 'A note on its own' },
      ],
    })
    expect(parsed.references).toEqual([{ url: 'https://acme.com', note: 'Nice shop' }])

    const six = Array.from({ length: 6 }, (_, index) => ({ url: `site${index}.com` }))
    expect(issuesOf({ ...completeAnswers(), references: six })).toEqual([['references', 'Up to 5 links']])
  })

  test('checks the email', () => {
    expect(issuesOf({ ...completeAnswers(), email: 'sam@' })).toEqual([['email', 'Enter a valid email']])
    expect(briefAnswersSchema.parse({ ...completeAnswers(), email: ' sam@example.com ' }).email).toBe('sam@example.com')
  })

  test('caps text at 200 characters', () => {
    expect(issuesOf({ ...completeAnswers(), business: 'a'.repeat(201) })).toEqual([
      ['business', 'Keep it under 200 characters'],
    ])
  })

  test('turns away a choice that is not an option', () => {
    expect(issuesOf({ ...completeAnswers(), budget: '£1m' })).toHaveLength(1)
  })
})

describe('briefStepSchemas', () => {
  test('checks only its own question and follow-ups', () => {
    expect(briefStepSchemas.services.safeParse({ services: ['Web Design'] }).success).toBe(true)
    expect(briefStepSchemas.services.safeParse({ services: ['Other'] }).success).toBe(false)
    expect(briefStepSchemas.services.safeParse({ services: ['Other'], servicesOther: 'Brand' }).success).toBe(true)
    expect(briefStepSchemas.website.safeParse({}).success).toBe(true)
  })
})

describe('isBriefFieldRequired', () => {
  test('reads off the schema', () => {
    expect(isBriefFieldRequired('services')).toBe(true)
    expect(isBriefFieldRequired('email')).toBe(true)
    expect(isBriefFieldRequired('references')).toBe(false)
    expect(isBriefFieldRequired('website')).toBe(false)
    expect(isBriefFieldRequired('source')).toBe(false)
  })
})

describe('briefSubmitSchema', () => {
  test('takes an elapsed time and a token alongside the answers', () => {
    const body = { answers: completeAnswers(), elapsed: 30_000, turnstileToken: 'token' }
    expect(briefSubmitSchema.safeParse(body).success).toBe(true)
    expect(briefSubmitSchema.safeParse({ ...body, elapsed: -1 }).success).toBe(false)
    expect(briefSubmitSchema.safeParse({ ...body, id: 'not-a-uuid' }).success).toBe(false)
  })
})
