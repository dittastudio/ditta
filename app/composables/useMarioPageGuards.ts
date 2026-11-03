import type { MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@vueuse/core'

const DOUBLE_TAP = 350 // ms
const DOUBLE_TAP_REACH = 40 // px between the two taps

// While Mario's on screen: the whole page goes unselectable (see html[data-mario]) and its touch gestures quiet down.
// Listening only then, so anywhere else on the page behaves as normal, however long he's out.
export default function useMarioPageGuards(isActive: MaybeRefOrGetter<boolean>) {
  const isTouch = useAtMedia('(hover: none)')
  const page = () => (toValue(isActive) ? document : null)

  useHead({ htmlAttrs: { 'data-mario': computed(() => (toValue(isActive) ? '' : undefined)) } })

  // Anything that still gets selected, by a long press iOS reads as text selection, say, is cleared straight away
  useEventListener(page, 'selectionchange', clearSelection)

  // Double-tap zoom anywhere else on the page: iOS ignores touch-action: manipulation unless it's on the very element
  // tapped, so a second tap hard on the heels of the first, in the same spot, is cancelled. A single tap still clicks, and
  // so does a quick tap somewhere else, like the audio toggle straight after the gamepad. Goes by distance, not target,
  // as a double tap landing either side of an element's edge still zooms.
  let lastTap: { time: number; x: number; y: number } | null = null

  useEventListener(
    page,
    'touchend',
    (event: TouchEvent) => {
      const touch = event.changedTouches[0]

      // Fingers still down or lifting together: a gesture or the gamepad, not a double tap
      if (!touch || event.touches.length || event.changedTouches.length > 1) {
        lastTap = null
        return
      }

      const isRepeat =
        lastTap &&
        event.timeStamp - lastTap.time < DOUBLE_TAP &&
        Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < DOUBLE_TAP_REACH

      if (isRepeat) event.preventDefault()

      lastTap = { time: event.timeStamp, x: touch.clientX, y: touch.clientY }
    },
    { passive: false },
  )

  // Long-press menus on links and images, on touch screens; a mouse's right-click menu is left alone
  useEventListener(page, 'contextmenu', (event: Event) => {
    if (isTouch.value) event.preventDefault()
  })
}
