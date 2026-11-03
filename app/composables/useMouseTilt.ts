import { unrefElement, useElementVisibility, useEventListener } from '@vueuse/core'
import type { MaybeElementRef } from '@vueuse/core'
import type { Ref } from 'vue'

interface Options {
  paused?: Ref<boolean> // holds the last values, for as long as it's true
}

/**
 * Makes an element follow the mouse, through CSS variables on it: `--tilt` for `rotate-(--tilt)`, plus `--mouse-x-percent`
 * and `--mouse-y-percent`, unitless 0-100 across the viewport. Written straight to the element, so following the mouse
 * never re-renders anything. Left alone off screen, catching up on the way back so it doesn't jump at the next move.
 */
export const useMouseTilt = (target: MaybeElementRef, { paused }: Options = {}) => {
  const isOnScreen = useElementVisibility(target)

  let mouseX: number | undefined
  let mouseY = 0

  const write = () => {
    if (mouseX === undefined || !isOnScreen.value || paused?.value) return

    const el = unrefElement(target) as HTMLElement | SVGElement | null | undefined

    if (!el) return

    const xRatio = mouseX / window.innerWidth

    el.style.setProperty('--tilt', `${xRatio * 80 - 40}deg`)
    el.style.setProperty('--mouse-x-percent', `${xRatio * 100}`)
    el.style.setProperty('--mouse-y-percent', `${(mouseY / window.innerHeight) * 100}`)
  }

  watch(isOnScreen, write)

  useEventListener(
    'mousemove',
    (event: MouseEvent) => {
      mouseX = event.clientX
      mouseY = event.clientY
      write()
    },
    { passive: true },
  )
}
