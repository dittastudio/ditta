import type { MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@vueuse/core'

const DOUBLE_TAP = 350 // ms

// While Mario's on screen: the whole page goes unselectable (see html[data-mario]) and its touch gestures quiet down.
// Listening only then, so anywhere else on the page behaves as normal, however long he's out.
export default function useMarioPageGuards(isActive: MaybeRefOrGetter<boolean>) {
  const isTouch = useAtMedia('(hover: none)')
  const page = () => (toValue(isActive) ? document : null)

  useHead({ htmlAttrs: { 'data-mario': computed(() => (toValue(isActive) ? '' : undefined)) } })

  // Anything that still gets selected, by a long press iOS reads as text selection, say, is cleared straight away
  useEventListener(page, 'selectionchange', clearSelection)

  // Double-tap zoom anywhere else on the page: iOS ignores touch-action: manipulation unless it's on the very element
  // tapped, so a second tap hard on the heels of the first is cancelled. A single tap still clicks.
  let lastTouchEnd = 0

  useEventListener(
    page,
    'touchend',
    (event: TouchEvent) => {
      if (event.timeStamp - lastTouchEnd < DOUBLE_TAP) event.preventDefault()
      lastTouchEnd = event.timeStamp
    },
    { passive: false },
  )

  // Long-press menus on links and images, on touch screens; a mouse's right-click menu is left alone
  useEventListener(page, 'contextmenu', (event: Event) => {
    if (isTouch.value) event.preventDefault()
  })
}
