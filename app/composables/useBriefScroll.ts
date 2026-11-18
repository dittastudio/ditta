import type { InjectionKey, ShallowRef } from 'vue'

type Frame = (target: Element | null | undefined) => void

const frameKey: InjectionKey<Frame> = Symbol('briefFrame')

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
 */
export function useBriefScroll(nav: Readonly<ShallowRef<HTMLElement | null>>) {
  const lenis = useLenis()
  const appStore = useAppStore()

  function band() {
    const viewport = window.visualViewport?.height ?? window.innerHeight
    const style = nav.value ? getComputedStyle(nav.value) : null
    // The nav is sticky over the content on mobile only; on desktop it sits in the flow
    const covered = style?.position === 'sticky' ? nav.value!.offsetHeight + Number.parseFloat(style.bottom) : 0

    return { top: appStore.getDockBottom, bottom: viewport - covered }
  }

  // Breathing room left between the dock and a heading lined up beneath it
  const gap = () => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spacing')) * 6 || 0

  function scrollBy(delta: number) {
    if (Math.abs(delta) < 1) return
    if (lenis.value) return lenis.value.scrollTo(lenis.value.animatedScroll + delta, SCROLL)

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollBy({ top: delta, behavior: reduce ? 'instant' : 'smooth' })
  }

  const frame: Frame = (target) => {
    if (!target) return

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
    if (inZone && headingTop >= top) return

    // Centre the field, but never scroll its heading up under the dock. A field too tall to centre lines its
    // heading up there instead.
    const centre = fits ? field.top + field.height / 2 - (top + bottom) / 2 : Infinity
    scrollBy(Math.min(centre, headingTop - top - gap()))
  }

  // Screens with nothing to fill in (summary, sent) line their top up under the dock when it's out of view
  function alignTop(el: Element) {
    const { top, bottom } = band()
    const rect = el.getBoundingClientRect()
    if (rect.top >= top && rect.top < bottom) return

    scrollBy(rect.top - top - gap())
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
    if (pointerType === 'touch' && (event.target as Element).matches('input, textarea')) return

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
