import { describe, expect, test } from 'vitest'
import {
  briefFirstName,
  briefSteps,
  formatBriefAnswer,
  hasBriefAnswer,
  isPrivateByDefault,
  personaliseBrief,
  suggestBriefEmail,
  visibleFollowUps,
} from '#shared/utils/brief'

const step = (key: string) => briefSteps.find((candidate) => candidate.key === key)!

describe('briefFirstName', () => {
  test('capitalises only the first letter of the first name', () => {
    expect(briefFirstName({ name: 'will russell' })).toBe('Will')
    expect(briefFirstName({ name: '  mcKenzie  Smith' })).toBe('McKenzie')
    expect(briefFirstName({})).toBe('')
  })
})

describe('personaliseBrief', () => {
  test('puts the first name in, or leaves it out with its comma', () => {
    expect(personaliseBrief('And your current website, [name]?', { name: 'sam taylor' })).toBe(
      'And your current website, Sam?',
    )
    expect(personaliseBrief('And your current website, [name]?', {})).toBe('And your current website?')
  })
})

describe('suggestBriefEmail', () => {
  test('suggests the common domain for a typo', () => {
    expect(suggestBriefEmail('Sam@Gmial.com')).toBe('sam@gmail.com')
    expect(suggestBriefEmail('sam@hotmail.co')).toBe('sam@hotmail.com')
  })

  test('suggests nothing for a domain it does not know', () => {
    expect(suggestBriefEmail('sam@gmail.com')).toBeNull()
    expect(suggestBriefEmail('sam@studio.co')).toBeNull()
    expect(suggestBriefEmail('@gmial.com')).toBeNull()
  })
})

describe('hasBriefAnswer and formatBriefAnswer', () => {
  test('count a list once it has a choice or a link', () => {
    expect(hasBriefAnswer([])).toBe(false)
    expect(hasBriefAnswer([{ url: ' ', note: 'Just a note' }])).toBe(false)
    expect(hasBriefAnswer([{ url: 'acme.com' }])).toBe(true)
    expect(hasBriefAnswer('  ')).toBe(false)
  })

  test('write answers as a line of text', () => {
    expect(formatBriefAnswer(['Web Design', 'Web Build'])).toBe('Web Design, Web Build')
    expect(
      formatBriefAnswer([
        { url: 'acme.com', note: 'Nice shop' },
        { url: 'example.org', note: '' },
        { url: '', note: 'Dropped' },
      ]),
    ).toBe('acme.com (Nice shop), example.org')
    expect(formatBriefAnswer(' Sam ')).toBe('Sam')
    expect(formatBriefAnswer(undefined)).toBeNull()
  })
})

describe('isPrivateByDefault', () => {
  test('spots hosts that are private until shared, with or without a scheme', () => {
    expect(isPrivateByDefault('drive.google.com/file/123')).toBe(true)
    expect(isPrivateByDefault('https://www.figma.com/design/abc')).toBe(true)
    expect(isPrivateByDefault('https://acme.sharepoint.com/sites/x')).toBe(true)
  })

  test('leaves other hosts, lookalikes and nonsense alone', () => {
    expect(isPrivateByDefault('acme.com')).toBe(false)
    expect(isPrivateByDefault('notfigma.com')).toBe(false)
    expect(isPrivateByDefault('')).toBe(false)
    expect(isPrivateByDefault('http://')).toBe(false)
  })
})

describe('visibleFollowUps', () => {
  test('shows a step’s follow-ups only while their answer is picked', () => {
    expect(visibleFollowUps(step('objectives'), { objectives: ['Explain what we do'] })).toEqual([])
    expect(
      visibleFollowUps(step('objectives'), { objectives: ['Sell online', 'Other'] }).map((followUp) => followUp.key),
    ).toEqual(['productCount', 'objectivesOther'])
  })
})
