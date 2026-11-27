import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

beforeEach(() => vi.useFakeTimers({ now: Date.UTC(2026, 10, 27, 12) }))
afterEach(() => vi.useRealTimers())

test('counts down the wait from the last send, and again after the next', async () => {
  const brief = useBriefStore()
  const wait = useRuntimeConfig().public.brief.resendCooldownMs / 1000
  brief.lastSentAt = Date.now()

  const scope = effectScope()
  const seconds = scope.run(() => useBriefResendWait())!
  expect(seconds.value).toBe(wait)

  vi.advanceTimersByTime(5000)
  expect(seconds.value).toBe(wait - 5)

  vi.advanceTimersByTime(wait * 1000)
  expect(seconds.value).toBe(0)

  brief.lastSentAt = Date.now()
  await nextTick()
  expect(seconds.value).toBe(wait)

  scope.stop()
})
