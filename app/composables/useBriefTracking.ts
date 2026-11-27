// The brief's funnel in Plausible (M7): Brief: Started → Brief: Step (one per step reached, with its key and number
// as props, for where people drop off) → Brief: Review → Brief: Sent. Brief: Confirmed is tracked by the confirm page,
// which can be on another device. Nothing from the answers is sent. Plausible ignores localhost and workers.dev
// (nuxt.config.ts), so only the live site counts.
export function useBriefTracking() {
  const brief = useBriefStore()

  watch(
    () => [brief.status, brief.stepIndex] as const,
    ([status, index], [previousStatus, previousIndex]) => {
      if (status === 'sent' && previousStatus === 'draft') return useTrackEvent('Brief: Sent')
      if (status !== 'draft') return
      if (previousStatus === 'intro') useTrackEvent('Brief: Started')
      else if (index === previousIndex) return

      if (brief.isSummary) return useTrackEvent('Brief: Review')
      const step = briefSteps[index]
      if (step) useTrackEvent('Brief: Step', { props: { step: step.key, number: String(index + 1) } })
    },
  )
}
