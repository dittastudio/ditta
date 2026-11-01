import { useEventListener } from '@vueuse/core'

interface Options {
  onFirstClick?: () => void // the first of a burst, to get ready for a rage that may follow
  onClick?: () => void
  onRage?: () => void
}

const RAGE_CLICKS = 7
const RAGE_WINDOW = 1500 // ms the clicks must land within
const SHAKE_RESET_DELAY = 500 // ms without a click before the shake settles

export const RAGE_SILENT_HOLD = 2000 // ms a rage lasts with no sound to time it by

// Rapid clicks build a shake; enough of them in a row tips into rage
export default function useRageClicks({ onFirstClick, onClick, onRage }: Options = {}) {
  const clickTimes: number[] = []
  const inRage = ref(false)
  const shakeLevel = ref(0)

  let shakeResetTimeout: ReturnType<typeof setTimeout> | null = null

  const shakeClass = computed(() => {
    if (inRage.value || shakeLevel.value <= 1) return ''
    if (shakeLevel.value <= 3) return 'shake-1'
    if (shakeLevel.value <= 5) return 'shake-2'
    return 'shake-3'
  })

  // iOS can select the text beside an unselectable element on a quick second tap, and CSS can't stop it. So for as long
  // as the clicks keep coming, and through any rage, whatever gets selected is cleared straight away.
  useEventListener(() => (shakeLevel.value > 0 || inRage.value ? document : null), 'selectionchange', clearSelection)

  const clearShakeReset = () => {
    if (shakeResetTimeout) clearTimeout(shakeResetTimeout)
    shakeResetTimeout = null
  }

  const click = () => {
    if (inRage.value) return

    clearSelection() // including anything selected before the first click, as @mousedown.prevent leaves that in place

    const now = Date.now()
    clickTimes.push(now)

    const cutoff = now - RAGE_WINDOW
    while (clickTimes.length && clickTimes[0]! < cutoff) clickTimes.shift()

    shakeLevel.value = clickTimes.length

    if (clickTimes.length === 1) onFirstClick?.()

    clearShakeReset()
    shakeResetTimeout = setTimeout(() => {
      shakeLevel.value = 0
    }, SHAKE_RESET_DELAY)

    if (clickTimes.length >= RAGE_CLICKS) {
      clickTimes.length = 0
      shakeLevel.value = 0
      clearShakeReset()
      inRage.value = true
      onRage?.()

      return
    }

    onClick?.()
  }

  const resetRage = () => {
    inRage.value = false
  }

  onUnmounted(clearShakeReset)

  return { inRage, shakeClass, click, resetRage }
}
