import type { InjectionKey } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

// `centre` skips the comfort zone and centres the field even when it's already in view. `instant` jumps there, for
// a new screen that's still invisible as it mounts, so there's nothing to glide.
interface FrameOptions {
  centre?: boolean
  instant?: boolean
}

type Frame = (target: Element | null | undefined, options?: FrameOptions) => void

const frameKey: InjectionKey<Frame> = Symbol('briefFrame')

// enterkeyhint only means anything on a field that brings up the keyboard, and every brief text field sets it.
// The cards (buttons) and the slider (a range input) don't.
const opensKeyboard = (el: EventTarget | null | undefined) =>
  el instanceof HTMLElement && el.hasAttribute('enterkeyhint')

// The same curve as --ease-outCubic. Lenis hands control back as soon as the user scrolls themselves, and makes
// programmatic scrolls instant under prefers-reduced-motion.
const SCROLL = { duration: 0.6, easing: (t: number) => 1 - (1 - t) ** 3 }

// The share of the visible band kept clear above and below a field before it counts as out of view
const COMFORT_MARGIN = 0.15

/**
 * Keeps the brief's active field framed in the part of the viewport you can actually see: below the dock and, on
 * mobile, above the sticky nav. It only scrolls when the field has drifted out of the middle of that band, and never
 * pushes the question's heading up under the dock.
 *
 * Fields mark themselves with `data-brief-target`, inside a `data-brief-question` wrapper that holds their
 * `data-brief-heading`. Anything below Shell reaches `frame` through `useBriefFrame()`.
 *
 * `navTop` reports where the nav's top edge sits when pinned to the bottom of the viewport, which is where it ends up
 * once a field has been scrolled into view.
 */
export function useBriefScroll(navTop: () => number | undefined) {
  const lenis = useLenis()
  const appStore = useAppStore()
  const reducedMotion = usePreferredReducedMotion()

  // The part of the screen a field can be seen in: below the dock, above the sticky nav
  const band = () => ({
    top: appStore.getDockBottom,
    bottom: navTop() ?? window.innerHeight,
  })

  // Breathing room left between the dock and a heading lined up beneath it
  const gap = () => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spacing')) * 6 || 0

  function scrollBy(delta: number, instant = false) {
    if (Math.abs(delta) < 1) return
    // From where the page really is, which every measurement here was taken against. Lenis's own record can lag:
    // when a shorter step shrinks the page under a reader scrolled near the bottom, the browser clamps the scroll
    // without Lenis hearing of it.
    if (lenis.value) return lenis.value.scrollTo(lenis.value.actualScroll + delta, { ...SCROLL, immediate: instant })

    window.scrollBy({ top: delta, behavior: instant || reducedMotion.value === 'reduce' ? 'instant' : 'smooth' })
  }

  const frame: Frame = (target, { centre: always = false, instant = false } = {}) => {
    if (!target) return

    // A text field that has just taken focus on touch may be opening the keyboard, and WebKit scrolls it into view
    // for that. Lenis would overwrite that scroll every frame of the glide, so the browser gets this one to itself.
    const focused = document.activeElement
    if (isTouch() && opensKeyboard(focused) && target.contains(focused)) return

    const { top, bottom } = band()
    const margin = (bottom - top) * COMFORT_MARGIN
    const zone = { top: top + margin, bottom: bottom - margin }
    const field = target.getBoundingClientRect()
    const heading = target.closest('[data-brief-question]')?.querySelector('[data-brief-heading]')
    const headingTop = heading?.getBoundingClientRect().top ?? field.top
    const fits = field.height <= zone.bottom - zone.top

    // A field too tall for the zone only needs its top in it
    const inZone = fits
      ? field.top >= zone.top && field.bottom <= zone.bottom
      : field.top >= zone.top && field.top <= zone.bottom
    if (!always && inZone && headingTop >= top) return

    // Centre the field, but never scroll its heading up under the dock. A field too tall to centre lines its
    // heading up there instead.
    const centre = fits ? field.top + field.height / 2 - (top + bottom) / 2 : Infinity
    scrollBy(Math.min(centre, headingTop - top - gap()), instant)
  }

  // Screens with nothing to fill in (summary, sent) line their top up under the dock when it's out of view. Only
  // ever as they mount, still invisible, so it jumps there.
  function alignTop(el: Element) {
    const { top, bottom } = band()
    const rect = el.getBoundingClientRect()
    if (rect.top >= top && rect.top < bottom) return

    scrollBy(rect.top - top - gap(), true)
  }

  // After a blocked Next, bring the first answer that needs fixing into view
  function frameFirstError(container: Element | null | undefined) {
    const invalid = container?.querySelector('[aria-invalid="true"]')
    frame(invalid?.closest('[data-brief-row], [data-brief-target]'))
  }

  // The first touch of the brief frames it. Never on page load: someone returning to a saved draft hasn't asked yet.
  let engaged = false
  let pointerType = ''

  function engage(event: Event) {
    if (engaged) return
    engaged = true

    // Tapping into a text field on touch opens the keyboard, and the OS scrolls for that itself
    if (pointerType === 'touch' && opensKeyboard(event.target)) return

    frame((event.currentTarget as Element).querySelector('[data-brief-target]'))
  }

  const engagement = {
    onPointerdown: (event: PointerEvent) => (pointerType = event.pointerType),
    // Click rather than pointerdown, so a card doesn't slide out from under a press before it lands
    onClick: engage,
    // Arriving by keyboard. A mouse press can focus a card too, but without :focus-visible, and its click follows.
    onFocusin: (event: FocusEvent) => {
      if ((event.target as Element).matches(':focus-visible')) engage(event)
    },
  }

  const disengage = () => (engaged = false)

  provide(frameKey, frame)

  return { frame, alignTop, frameFirstError, engagement, disengage }
}

// For fields below Shell (follow-ups, link rows) to bring themselves into view as they appear
export function useBriefFrame(): Frame {
  return inject(frameKey, () => {})
}
