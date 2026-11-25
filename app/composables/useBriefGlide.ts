import type { ComponentPublicInstance } from 'vue'
import { useEventListener, useResizeObserver } from '@vueuse/core'

const GLIDE_MS = 300
// --ease-outQuart, which the glide runs on, for a scroll to keep in step with it
const outQuart = (t: number) => 1 - (1 - t) ** 4

interface BriefGlideMotion {
  // How far the step is still drawn from where it sits in the layout
  offset: number
  // What's left of the glide, for a scroll that runs alongside it
  duration: number
  easing: (t: number) => number
}

const offset = (el: Element) => Number.parseFloat(getComputedStyle(el).translate.split(' ')[1] ?? '') || 0

/**
 * A brief step is centred on the screen, so when it grows or shrinks (a follow-up opening under Other, a link row
 * added, a suggestion coming and going) everything in it jumps by half the change. This glides it there instead: when
 * the step's size changes it's put back where it was with `translate`, then eased to its new place. The new part fades
 * and rises in alongside, into the space the step is moving to make. A step taller than the screen isn't centred, so it
 * doesn't move and there's nothing to glide.
 *
 * Pass `observe` as the step's ref. `motion` describes a glide underway, and `onStart` tells as one starts, so a
 * scroll can be measured against where the step is going and run alongside it (see useBriefScroll).
 */
export function useBriefGlide() {
  const reducedMotion = useAtMedia('(prefers-reduced-motion: reduce)')

  const screen = shallowRef<HTMLElement | null>(null)
  // Where the step sits in the layout, ignoring any glide underway
  let top = 0
  let width = 0
  let glide: Animation | undefined
  // --ease-outQuart, read once from the first step
  let easing: string | undefined
  // Told as each glide starts, so a scroll can start in the same frame
  const listeners = new Set<() => void>()

  // A function ref runs on every render of its parent, not only when the step changes, so it only measures a new step
  function observe(el: Element | ComponentPublicInstance | null) {
    const next = el instanceof HTMLElement ? el : null
    if (next === screen.value) return
    screen.value = next
    measure()
  }

  function measure() {
    if (!screen.value) return
    top = screen.value.offsetTop
    width = screen.value.offsetWidth
  }

  // Swapping steps has its own transition, which this would fight
  const swapping = (el: HTMLElement) => [...el.classList].some((name) => /-(enter|leave)-active$/.test(name))
  // An error or a link's note opening or closing eases its own height (see brief-open), so the step's layout already
  // moves smoothly. A glide on top would restart every frame it grows and trail behind it.
  const easingOwnHeight = (el: HTMLElement) => !!el.querySelector('.brief-open-enter-active, .brief-open-leave-active')

  useResizeObserver(screen, () => {
    const el = screen.value
    if (!el) return

    const delta = top - el.offsetTop
    // A change of width is the window resizing, where the step should simply be where it belongs
    const resized = el.offsetWidth !== width
    measure()
    if (!delta || resized || reducedMotion.value || swapping(el) || easingOwnHeight(el)) return

    // Picks up from wherever a glide already underway has got to
    const current = offset(el)
    glide?.cancel()
    glide = el.animate([{ translate: `0 ${current + delta}px` }, { translate: '0 0' }], {
      duration: GLIDE_MS,
      easing: (easing ??= getComputedStyle(el).getPropertyValue('--ease-outQuart').trim() || 'ease-out'),
    })
    for (const listener of listeners) listener()
  })

  // The screen's height moves a centred step without changing its size, so nothing above sees it. Measured once a
  // frame at most, while the window is being dragged.
  let resizing = 0
  useEventListener(
    'resize',
    () => {
      cancelAnimationFrame(resizing)
      resizing = requestAnimationFrame(measure)
    },
    { passive: true },
  )

  function motion(): BriefGlideMotion | undefined {
    const el = screen.value
    if (!el || glide?.playState !== 'running') return
    const elapsed = Number(glide.currentTime ?? 0)
    return { offset: offset(el), duration: Math.max(GLIDE_MS - elapsed, 0) / 1000, easing: outQuart }
  }

  // Returns the way to stop listening
  function onStart(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return { observe, motion, onStart }
}

export type BriefGlide = ReturnType<typeof useBriefGlide>
