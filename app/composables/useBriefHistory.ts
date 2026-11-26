import { useEventListener } from '@vueuse/core'
import { briefStepSchemas } from '#shared/schemas/brief'

interface BriefHistoryState {
  // How many of the brief's entries sit behind this one
  briefDepth?: number
  // When the brief this entry belongs to was started (the store's startedAt), so entries left over from a brief that
  // has since been started again or sent can be told apart
  briefStart?: number | null
  // Whether this step was opened with Edit from the review, so Next goes back there
  briefEditing?: boolean
  // Vue Router's own: the path of the entry behind this one
  back?: string | null
}

const historyState = () => (history.state as BriefHistoryState | null) ?? {}

// The URL's name for where the brief is: no step for the intro (and the thanks), ?step=3, ?step=review
function briefParam(brief: ReturnType<typeof useBriefStore>) {
  if (brief.status !== 'draft') return undefined
  return brief.isSummary ? 'review' : String(brief.stepIndex + 1)
}

function stepParamOf(path: string | null | undefined) {
  if (!path) return undefined
  const url = new URL(path, location.origin)
  return url.pathname === location.pathname ? (url.searchParams.get('step') ?? '') : undefined
}

// Puts the brief where the URL says, while it's still being filled in: no step is the intro, and a step is that
// step, so long as every step before it has been answered. A step further on than that lands on the first one still
// to answer. Answers are kept either way. A brief that has gone (sent, confirmed) stays where it is.
// Called once before the brief first renders, so it opens where the URL says rather than where it was left, and again
// on every Back and Forward, which also say whether the step was being edited from the review.
export function followBriefUrl(value: unknown, fromSummary = false) {
  const brief = useBriefStore()
  if (!brief.inProgress) return

  const index = value === 'review' ? brief.summaryIndex : Number(value) - 1
  if (!Number.isInteger(index) || index < 0 || index > brief.summaryIndex) {
    if (brief.status === 'draft') brief.showIntro()
    return
  }

  const reachable = briefSteps.findIndex((step) => !briefStepSchemas[step.key].safeParse(brief.answers).success)
  if (brief.status === 'intro') brief.start()
  const to = reachable === -1 ? index : Math.min(index, reachable)
  brief.goTo(to, fromSummary && to === index && to < brief.summaryIndex)
}

// The intro and each step are their own history entries, named in the URL (see briefParam), so the browser's own Back
// and Forward (Cmd+[, Alt+←, a mouse's back button, a swipe) move through the brief as the nav does, rather than
// leaving it. An entry only goes in on a move forward, which is always a press or a key: Chrome's Back skips entries
// added without one. The URL says where the brief is (see followBriefUrl); the store keeps the answers.
// Starting over or sending takes the trail away, so Back doesn't walk into a brief that's gone.
// `onBack` is for a Back from the browser, to sound like the nav's.
export function useBriefHistory(onBack: () => void) {
  const brief = useBriefStore()
  const router = useRouter()
  // The brief's own page. A Back or Forward to anywhere else is the router's to handle, not the brief's.
  const briefPath = router.currentRoute.value.path

  const param = computed(() => briefParam(brief))

  let depth = 0
  // The store is following the URL, or has written it already, so the URL needn't follow the store
  let applying = false
  // Heading back to the brief's first entry to drop the trail after it
  let collapsing = false
  // A Back the nav asked for, which has already made its sound
  let fromNav = false

  function write(mode: 'push' | 'replace') {
    const { step: _, ...query } = router.currentRoute.value.query
    const to = {
      query: param.value ? { ...query, step: param.value } : query,
      state: { briefDepth: depth, briefStart: brief.startedAt, briefEditing: brief.editingFromSummary },
    }
    ;(mode === 'push' ? router.push(to) : router.replace(to)).catch(() => {})
  }

  // A move the watcher below then leaves alone. Cleared once the watcher has run, which is before nextTick resolves.
  function apply(move: () => void) {
    applying = true
    move()
    void nextTick(() => (applying = false))
  }

  // A move forward adds an entry; anything else (the thanks, the intro after a reset) takes this one's place
  watch(param, () => {
    if (applying || collapsing) return
    if (!param.value) return write('replace')

    depth++
    write('push')
  })

  // Back to the brief's first entry, which then shows wherever the brief is now: the intro, or the thanks
  function collapse() {
    if (depth === 0) return write('replace')
    collapsing = true
    history.go(-depth)
  }

  brief.$onAction(({ name, after }) => {
    // A reset while sending does nothing, so there's nothing to collapse
    if ((name === 'reset' && !brief.sending) || name === 'markPending' || name === 'markConfirmed') after(collapse)
  })

  // Puts the entry right once the router has caught up with a Back or Forward. Sooner, and the router (still on the
  // entry it's leaving) can take the replace for a duplicate and drop it, then finish arriving at the wrong step.
  function rewriteAfterPop() {
    const stop = router.afterEach(() => {
      stop()
      write('replace')
    })
  }

  useEventListener(window, 'popstate', () => {
    if (location.pathname !== briefPath) return

    const state = historyState()
    const to = state.briefDepth ?? 0
    const wentBack = to < depth
    depth = to

    if (collapsing) {
      collapsing = false
      return rewriteAfterPop()
    }

    if (wentBack && !fromNav) onBack()
    fromNav = false

    const stepParam = new URLSearchParams(location.search).get('step') ?? undefined
    // Forward into a brief that has since been started again or sent: those entries are left after the brief's first
    // one (see collapse), so the brief stays where it is and the entry is put right
    if (stepParam && state.briefStart !== undefined && state.briefStart !== brief.startedAt) return rewriteAfterPop()

    apply(() => followBriefUrl(stepParam, state.briefEditing))
    // A brief that has gone, or a step not yet reached: the entry is put right to where the brief is
    if (stepParam !== param.value) rewriteAfterPop()
  })

  onMounted(() => {
    depth = historyState().briefDepth ?? 0
    void router.isReady().then(() => {
      if (router.currentRoute.value.query.step !== param.value) write('replace')
    })
  })

  // The nav's Back. Through the history when the entry behind is the step Back goes to, so the browser's Forward
  // undoes it. Otherwise (a reload partway, a URL typed in, the review reached from an edit) the brief moves in place
  // and this entry follows it, so Back can never land anywhere the nav didn't mean.
  function back() {
    if (brief.status === 'sent') return apply(() => (brief.setStatus('draft'), write('replace')))

    const target = brief.editingFromSummary ? 'review' : String(brief.stepIndex)
    if (depth > 0 && stepParamOf(historyState().back) === target) {
      fromNav = true
      return router.back()
    }

    apply(() => (brief.back(), write('replace')))
  }

  return { back }
}
