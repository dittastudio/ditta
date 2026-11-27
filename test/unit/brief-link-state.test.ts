import { describe, expect, test } from 'vitest'
import type { BriefRow } from '../../server/utils/briefs'
import { briefLinkState } from '../../server/utils/briefs'
import { completeAnswers } from './fixtures'

const NOW = Date.UTC(2026, 10, 27, 12)

const row = (overrides: Partial<BriefRow> = {}): BriefRow => ({
  id: 'a1962566-4344-4691-a5aa-4a15b26a3f79',
  name: 'Sam Taylor',
  email: 'sam@example.com',
  status: 'pending',
  answers: JSON.stringify(completeAnswers()),
  token_hash: 'hash',
  token_expires_at: NOW + 1000,
  owner_hash: 'owner',
  send_count: 1,
  last_sent_at: NOW - 1000,
  confirmed_at: null,
  notified_at: null,
  pdf_key: null,
  pdf_attempts: 0,
  created_at: NOW - 1000,
  updated_at: NOW - 1000,
  ...overrides,
})

describe('briefLinkState', () => {
  test('says nothing about a link it has no brief for', () => {
    expect(briefLinkState(null, NOW)).toEqual({ state: 'invalid' })
  })

  test('shows a pending brief, with what the confirm page needs', () => {
    expect(briefLinkState(row(), NOW)).toEqual({
      state: 'pending',
      id: row().id,
      name: 'Sam Taylor',
      email: 'sam@example.com',
      business: 'Independent coffee roaster in Hackney',
    })
  })

  test('expires a pending link at its time, to the millisecond', () => {
    expect(briefLinkState(row({ token_expires_at: NOW }), NOW)).toEqual({ state: 'expired' })
    expect(briefLinkState(row({ token_expires_at: NOW + 1 }), NOW).state).toBe('pending')
  })

  test('says when a confirmed brief arrived, however old its link', () => {
    const confirmed = row({ status: 'confirmed', confirmed_at: NOW - 500, token_expires_at: NOW - 100 })
    expect(briefLinkState(confirmed, NOW)).toEqual({
      state: 'confirmed',
      id: confirmed.id,
      name: 'Sam Taylor',
      confirmedAt: NOW - 500,
    })
  })
})
