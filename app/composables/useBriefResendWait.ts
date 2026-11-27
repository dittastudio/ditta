import { useIntervalFn } from '@vueuse/core'

// Whole seconds until Check your inbox can send the link again, counting down live, and 0 once it can. Ticks only
// while there's a wait, and starts again whenever a send moves lastSentAt on.
export function useBriefResendWait() {
  const brief = useBriefStore()
  const seconds = ref(0)
  const { resendCooldownMs } = useRuntimeConfig().public.brief

  const left = () => Math.max(0, Math.ceil((brief.lastSentAt + resendCooldownMs - Date.now()) / 1000))

  function tick() {
    seconds.value = left()
    if (!seconds.value) pause()
  }

  // A quarter second, so the count turns over close to each real second rather than up to one late
  const { pause, resume } = useIntervalFn(tick, 250, { immediate: false })

  watch(
    () => brief.lastSentAt,
    () => {
      tick()
      if (seconds.value) resume()
    },
    { immediate: true },
  )

  return seconds
}
