import { beforeEach, describe, expect, test } from 'vitest'
import type { BriefDraft } from '#shared/utils/brief'

// What the brief saves in this browser, as an older version of the site might have left it
function saved(state: Record<string, unknown>) {
  localStorage.setItem('brief', JSON.stringify(state))
  const brief = useBriefStore()
  brief.$hydrate()
  return brief
}

const complete: BriefDraft = {
  services: ['Web Design'],
  business: 'Independent coffee roaster in Hackney',
  objectives: ['Explain what we do'],
  timing: 'ASAP',
  contentStage: 'Ready to go',
  budget: '£10k–£20k',
  name: 'sam taylor',
  email: 'sam@example.com',
}

beforeEach(() => {
  localStorage.clear()
  const brief = useBriefStore()
  brief.sending = false
  brief.reset()
})

describe('a saved brief, loaded', () => {
  test('keeps an answer whose option was reworded', () => {
    expect(saved({ answers: { source: 'From a website you made' } }).answers.source).toBe('Your work')
  })

  test('turns a single files link into link rows', () => {
    expect(saved({ answers: { files: 'drive.google.com/x' } }).answers.files).toEqual([
      { url: 'drive.google.com/x', note: '' },
    ])
    expect(saved({ answers: { files: '  ' } }).answers).not.toHaveProperty('files')
  })

  test('drops choices that are no longer options, keeping the rest', () => {
    const brief = saved({ answers: { services: ['Web Design', 'Branding'], objectives: ['Gone'], budget: '£1m' } })
    expect(brief.answers.services).toEqual(['Web Design'])
    expect(brief.answers).not.toHaveProperty('objectives')
    expect(brief.answers).not.toHaveProperty('budget')
  })

  test('sends one left "sent" by the prototype back to the review', () => {
    expect(saved({ status: 'sent', briefId: null }).status).toBe('draft')
    expect(saved({ status: 'sent', briefId: 'a1962566-4344-4691-a5aa-4a15b26a3f79' }).status).toBe('sent')
  })

  test('gives settings added since their defaults', () => {
    expect(saved({ settings: {} }).settings).toEqual({ shortcuts: false })
    expect(saved({ settings: { shortcuts: true } }).settings).toEqual({ shortcuts: true })
  })
})

describe('moving through the brief', () => {
  test('stays between the first step and the review', () => {
    const brief = useBriefStore()
    brief.goTo(-3)
    expect(brief.stepIndex).toBe(0)
    brief.goTo(99)
    expect(brief.stepIndex).toBe(brief.summaryIndex)
    expect(brief.isSummary).toBe(true)
  })

  test('goes back to the review from a step opened with Edit', () => {
    const brief = useBriefStore()
    brief.goTo(3, true)
    brief.next()
    expect(brief.isSummary).toBe(true)

    brief.goTo(3, true)
    brief.back()
    expect(brief.isSummary).toBe(true)
  })

  test('labels the main button by what it will do', () => {
    const brief = useBriefStore()
    brief.goTo(briefSteps.findIndex((step) => step.key === 'references'))
    expect(brief.advance).toBe('skip')
    brief.setAnswer('references', [{ url: 'acme.com' }])
    expect(brief.advance).toBe('next')
    brief.goTo(briefSteps.findIndex((step) => step.key === 'email'))
    expect(brief.advance).toBe('review')
  })

  test('holds still while a send is in flight', () => {
    const brief = useBriefStore()
    brief.sending = true
    brief.goTo(4)
    brief.reset()
    expect(brief.stepIndex).toBe(0)
    brief.sending = false
  })
})

describe('once the brief has gone', () => {
  test('confirming clears the answers and keeps the first name for the thanks', () => {
    const brief = useBriefStore()
    Object.assign(brief.answers, complete)
    brief.markPending('a1962566-4344-4691-a5aa-4a15b26a3f79', 'sam@example.com')
    expect(brief.status).toBe('sent')

    brief.markConfirmed()
    expect(brief.status).toBe('confirmed')
    expect(brief.answers).toEqual({})
    expect(brief.briefId).toBeNull()
    expect(brief.sentName).toBe('Sam')
  })
})

describe('followBriefUrl', () => {
  test('opens a step only once every step before it is answered', () => {
    const brief = useBriefStore()
    followBriefUrl('5')
    expect(brief.status).toBe('draft')
    expect(brief.stepIndex).toBe(0)

    brief.setAnswer('services', ['Web Design'])
    followBriefUrl('5')
    expect(brief.stepIndex).toBe(1)
  })

  test('opens the review for a complete brief, marking an edit only where it lands', () => {
    const brief = useBriefStore()
    Object.assign(brief.answers, complete)
    followBriefUrl('review')
    expect(brief.isSummary).toBe(true)

    followBriefUrl('3', true)
    expect(brief.stepIndex).toBe(2)
    expect(brief.editingFromSummary).toBe(true)
  })

  test('goes back to the intro for no step or a step that does not exist', () => {
    const brief = useBriefStore()
    brief.start()
    followBriefUrl('99')
    expect(brief.status).toBe('intro')
  })

  test('leaves a brief that has gone where it is', () => {
    const brief = useBriefStore()
    brief.markPending('a1962566-4344-4691-a5aa-4a15b26a3f79', 'sam@example.com')
    followBriefUrl('1')
    expect(brief.status).toBe('sent')
  })
})
