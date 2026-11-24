import { useEventListener } from '@vueuse/core'

interface BriefHistoryState {
  // How many of the brief's steps sit behind this entry
  briefDepth?: number
}

const depthOf = () => (history.state as BriefHistoryState | null)?.briefDepth ?? 0

// Each step is its own history entry, named in the URL (?step=3, ?step=review), so the browser's own Back and Forward
// (Cmd+[, Alt+←, a mouse's back button, a swipe) move through the brief as the nav does, rather than leaving it.
// An entry only goes in on a move forward, which is always a press or a key: Chrome's Back skips entries added
// without one. The store stays the source of truth, so a reload or a hand-edited URL is put back to where the brief is.
// Starting over or sending takes the trail away, so Back doesn't walk into a brief that's gone.
// `onBack` is for a Back from the browser, to sound like the nav's.
export function useBriefHistory(onBack: () => void) {
  const brief = useBriefStore()
  const router = useRouter()

  const param = computed(() => {
    if (brief.status !== 'draft') return undefined
    return brief.isSummary ? 'review' : String(brief.stepIndex + 1)
  })

  const indexOf = (value: string | null) => {
    if (value === 'review') return brief.summaryIndex
    const step = Number(value)
    return Number.isInteger(step) && step >= 1 && step <= brief.total ? step - 1 : undefined
  }

  let depth = 0
  // The store is following the URL, so the URL needn't follow the store
  let applying = false
  // The next move takes the place of this entry instead of adding one: a step back with no entry behind it
  let replacing = false
  // Heading back to the brief's first entry to drop the trail after it
  let collapsing = false
  // A Back the nav asked for, which has already made its sound
  let fromNav = false

  function write(mode: 'push' | 'replace') {
    const { step: _, ...query } = router.currentRoute.value.query
    const to = { query: param.value ? { ...query, step: param.value } : query, state: { briefDepth: depth } }
    ;(mode === 'push' ? router.push(to) : router.replace(to)).catch(() => {})
  }

  watch(param, () => {
    if (applying || collapsing) return
    if (replacing || !param.value) {
      replacing = false
      return write('replace')
    }

    depth++
    write('push')
  })

  // Back to the brief's first entry, which then shows wherever the brief is now: the first step, or the thanks
  function collapse() {
    if (depth === 0) return write('replace')
    collapsing = true
    history.go(-depth)
  }

  brief.$onAction(({ name, after }) => {
    if (name === 'reset' || name === 'markSent') after(collapse)
  })

  useEventListener(window, 'popstate', () => {
    const to = depthOf()
    const wentBack = to < depth
    depth = to

    if (collapsing) {
      collapsing = false
      return write('replace')
    }

    const index = indexOf(new URLSearchParams(location.search).get('step'))
    // Sent, or an entry from before: nothing to move to, so the URL is put right instead
    if (brief.status !== 'draft' || index === undefined) {
      fromNav = false
      return write('replace')
    }

    if (wentBack && !fromNav) onBack()
    fromNav = false
    applying = true
    brief.goTo(index)
    brief.direction = wentBack ? -1 : 1
    void nextTick(() => (applying = false))
  })

  onMounted(() => {
    depth = depthOf()
    void router.isReady().then(() => {
      if (router.currentRoute.value.query.step !== param.value) write('replace')
    })
  })

  // The nav's Back: through the history when there's a step behind, so the two never disagree
  function back() {
    if (brief.status === 'sent') {
      replacing = true
      return brief.setStatus('draft')
    }

    if (depth > 0) {
      fromNav = true
      return router.back()
    }

    replacing = true
    brief.back()
  }

  return { back }
}
