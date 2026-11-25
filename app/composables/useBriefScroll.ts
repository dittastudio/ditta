import type { InjectionKey } from 'vue'
import type { BriefGlide } from './useBriefGlide'
import { usePreferredReducedMotion } from '@vueuse/core'

// `centre` skips the comfort zone and centres the field even when it's already in view. `instant` jumps there, for
// a new screen that's still invisible as it mounts, so there's nothing to glide.
interface FrameOptions {
  centre?: boolean
  instant?: boolean
}

type Frame = (target: Element | null | undefined, options?: FrameOptions) => void

const frameKey: InjectionKey<Frame> = Symbol('briefFrame')

// The same curve as --ease-outCubic. Lenis hands control back as soon as the user scrolls themselves, and makes
// programmatic scrolls instant under prefers-reduced-motion.
const SCROLL = { duration: 0.6, easing: (t: number) => 1 - (1 - t) ** 3 }

type ScrollTiming = typeof SCROLL

// The share of the visible band kept clear above and below a field before it counts as out of view
const COMFORT_MARGIN = 0.15

/**
 * Keeps the brief's active field framed in the part of the viewport you can actually see: below the dock and, on
 * mobile, above the nav. It only scrolls when the field has drifted out of the middle of that band, and never
 * pushes the question's heading up under the dock.
 *
 * Fields mark themselves with `data-brief-target`, inside a `data-brief-question` wrapper that holds their
 * `data-brief-heading`. Anything below Shell reaches `frame` through `useBriefFrame()`.
 *
 * `navTop` reports where the nav's top edge sits when pinned to the bottom of the viewport, which is where it ends up
 * once a field has been framed. `end` is the brief's outer box: it's never scrolled up past the bottom of the screen,
 * so the footer only comes into view when the reader scrolls to it, and an answer given down there scrolls back to
 * clear it, pinning the nav again rather than leaving it to move with the end of the brief as steps change height.
 *
 * `glide` is the step's glide (see useBriefGlide). An answer that opens or closes
 * something moves the step, and a scroll made after that would be a second movement, often back the other way. So a
 * field is measured where the glide is taking it, and scrolled to alongside the glide, on the same curve and in the
 * same time: the two add up to one movement.
 */
export function useBriefScroll(
  navTop: () => number | undefined,
  end: () => Element | null | undefined,
  glide: Pick<BriefGlide, 'motion' | 'onStart'>,
) {
  const lenis = useLenis()
  const appStore = useAppStore()
  const reducedMotion = usePreferredReducedMotion()

  // The part of the screen a field can be seen in: below the dock, above the nav, and within the visual
  // viewport, which ends at the keyboard when it's up (the nav is behind it then)
  const band = () => {
    const visible = window.visualViewport
    const top = Math.max(appStore.getDockBottom, visible?.offsetTop ?? 0)
    const bottom = Math.min(navTop() ?? window.innerHeight, visible ? visible.offsetTop + visible.height : Infinity)
    return { top, bottom }
  }

  // Breathing room left between the dock and a heading lined up beneath it
  const gap = () => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spacing')) * 6 || 0

  // The furthest a scroll can go before the brief's end would rise above the bottom of the screen: negative when it
  // already has, scrolled down to the footer. No limit while the keyboard is up: then the field may need lifting
  // above it, wherever the brief ends.
  function endLimit() {
    const box = end()
    return box && !isKeyboardOpen() ? box.getBoundingClientRect().bottom - window.innerHeight : Infinity
  }

  function scrollBy(delta: number, instant = false, timing: ScrollTiming = SCROLL) {
    // Never leaves the brief's end above the bottom of the screen, pulling it back down if a taller step or the
    // reader left it there
    delta = Math.min(delta, endLimit())
    if (Math.abs(delta) < 1) return
    // From where the page really is, which every measurement here was taken against. Lenis's own record can lag:
    // when a shorter step shrinks the page under a reader scrolled near the bottom, the browser clamps the scroll
    // without Lenis hearing of it.
    if (lenis.value) return lenis.value.scrollTo(lenis.value.actualScroll + delta, { ...timing, immediate: instant })

    window.scrollBy({ top: delta, behavior: instant || reducedMotion.value === 'reduce' ? 'instant' : 'smooth' })
  }

  const frame: Frame = (target, { centre: always = false, instant = false } = {}) => {
    if (!target) return

    // While the keyboard is opening for a focused field, WebKit scrolls that field into view, and a Lenis glide would
    // fight it, so the browser has this one to itself. A new step's instant jump has nothing to fight (its field
    // focused without scrolling, see TextInput), so it's made now and again once the keyboard is up and the band has
    // shrunk to it.
    const keyboardOpening = isTouch() && opensKeyboard(document.activeElement) && !isKeyboardOpen()
    if (keyboardOpening && !instant && target.contains(document.activeElement)) return
    if (keyboardOpening && instant) {
      window.visualViewport?.addEventListener(
        'resize',
        () => {
          if (isKeyboardOpen() && target.isConnected) frame(target, { centre: true, instant: true })
        },
        { signal: AbortSignal.timeout(800) },
      )
    }

    const { top, bottom } = band()
    const margin = (bottom - top) * COMFORT_MARGIN
    const zone = { top: top + margin, bottom: bottom - margin }
    // Where the step's glide is taking it, rather than where it's drawn now
    const gliding = instant ? undefined : glide.motion()
    const shift = gliding?.offset ?? 0
    const timing = gliding ? { duration: gliding.duration, easing: gliding.easing } : SCROLL

    const rect = target.getBoundingClientRect()
    const field = { top: rect.top - shift, bottom: rect.bottom - shift, height: rect.height }
    const heading = target.closest('[data-brief-question]')?.querySelector('[data-brief-heading]')
    const headingTop = (heading?.getBoundingClientRect().top ?? rect.top) - shift
    const fits = field.height <= zone.bottom - zone.top

    // Scrolled down to the footer, the nav is riding up with the brief's end. scrollBy always scrolls back until the
    // end meets the bottom of the screen, which clears the footer and pins the nav again, so the field is judged
    // from where that leaves it. A field too tall for the zone only needs its top in it.
    const cleared = Math.min(0, endLimit())
    const fieldTop = field.top - cleared
    const inZone = fits
      ? fieldTop >= zone.top && field.bottom - cleared <= zone.bottom
      : fieldTop >= zone.top && fieldTop <= zone.bottom

    // Centre the field, but never scroll its heading up under the dock. A field too tall to centre lines its
    // heading up there instead. A field that's fine where it is needn't move, though scrollBy still clears the
    // footer.
    const centre = fits ? field.top + field.height / 2 - (top + bottom) / 2 : Infinity
    const delta = !always && inZone && headingTop - cleared >= top ? 0 : Math.min(centre, headingTop - top - gap())
    scrollBy(delta, instant, timing)
  }

  // A frame asked for as something changes: an answer given, a follow-up or link row appearing. Made as the glide the
  // change sets off starts, in the same frame, so the scroll runs alongside it from its first step. A change that
  // doesn't move the step sets off no glide, so it's made two frames on regardless, once the change is laid out.
  // Asked for more than once in the meantime, the last one wins: a pick that opens a follow-up frames the follow-up,
  // in one movement, rather than the question and then the follow-up.
  // Each batch of requests is its own object, so a batch's fallback can only ever make that batch's frame.
  let pending: { target: Element; options?: FrameOptions } | undefined

  const frameSoon: Frame = (target, options) => {
    if (!target) return
    if (pending) {
      Object.assign(pending, { target, options })
      return
    }

    const batch = { target, options }
    pending = batch

    const flush = () => {
      stopListening()
      if (pending !== batch) return
      pending = undefined
      if (batch.target.isConnected) frame(batch.target, batch.options)
    }
    const stopListening = glide.onStart(flush)
    requestAnimationFrame(() => requestAnimationFrame(flush))
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

  // Every answer given frames the question it's in: a card or chip picked, a field focused. Only when it needs it
  // (see frame), so picking several options in a row doesn't move the page under them, but always when the footer
  // is in view, so the nav is pinned again. Never on page load: someone returning to a saved draft hasn't asked yet.
  let pointerType = ''

  function engage(event: Event) {
    // Tapping into a text field on touch opens the keyboard, and the OS scrolls for that itself
    if (pointerType === 'touch' && opensKeyboard(event.target)) return

    const target = (event.target as Element).closest('[data-brief-target]')
    frameSoon(target)
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

  provide(frameKey, frameSoon)

  return { frame, alignTop, frameFirstError, engagement }
}

// For fields below Shell (follow-ups, link rows) to bring themselves into view as they appear
export function useBriefFrame(): Frame {
  return inject(frameKey, () => {})
}
