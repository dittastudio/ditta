import { gsap } from 'gsap'

// Where the bar is on screen: its horizontal centre, its top, its size and its corner radius
interface Box {
  centre: number
  top: number
  width: number
  height: number
  radius: number
}

const boxOf = (rect: DOMRect, radius: number): Box => ({
  centre: rect.left + rect.width / 2,
  top: rect.top,
  width: rect.width,
  height: rect.height,
  radius,
})

// An element's corner radius in px, for the bar to take on as it lands on it or sets off from it
export const radiusOf = (el: Element) => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0

const START_SELECTOR = '[data-brief-nav-start]'
const CONTENTS_SELECTOR = '[data-brief-nav-contents]'
const PART_SELECTOR = '[data-brief-nav-part]'

// Everything the morph sets inline, for clearing once it's done
const MORPH_PROPS = 'x,y,xPercent,width,height,borderRadius,outlineWidth,maxWidth,marginLeft,overflow'

/**
 * The intro's Start button and the brief's nav are one bar. Pressing Start, it drops to where the nav is pinned and
 * widens into it; going back to the intro, the nav shrinks back up into Start.
 *
 * They're two elements: Start is in the intro screen, which goes as the first question comes in, and the nav is
 * in its own place at the bottom. So it's done FLIP-style. The nav is shown where Start was, then let go to where it
 * belongs. Start is the size of the nav's buttons, so the bar's width, height and corners are animated, rather than
 * its scale, which would stretch the squircle corners and the text. Nothing
 * around it reflows (it's pulled out of the brief's flow by its own height), and it plays once a brief.
 *
 * The nav is sticky, so its place in the layout moves with the page: it rides up with the brief's end near the footer,
 * and the first question scrolls the page as it comes in, partway through growing. So the bar travels between two
 * points on the screen, and every frame it's offset from wherever its place in the layout is by then. `bar` is that
 * place (the nav's sticky wrapper, which is never transformed itself), and `pinnedTop` is where its top will be once
 * it's pinned to the bottom of the screen, which framing the first question always leaves it.
 *
 * `morphing` is true from the moment either way starts until it's landed: the nav stays shown for it, and Start
 * stays hidden.
 */
interface MorphElements {
  start: () => HTMLElement | null | undefined
  nav: () => HTMLElement | null | undefined
  bar: () => HTMLElement | null | undefined
}

export function useBriefMorph({ start: startButton, nav, bar }: MorphElements) {
  const brief = useBriefStore()
  const reducedMotion = useAtMedia('(prefers-reduced-motion: reduce)')
  const morphing = ref(false)
  // The journey underway, so a new one can take over from wherever it's got to
  let journey: gsap.core.Timeline | undefined
  // Where the bar is being held on screen while the intro comes in, and the tick that holds it there
  let held: Box | undefined
  let holding: (() => void) | undefined

  const parts = (el: HTMLElement) => ({
    start: el.querySelector(START_SELECTOR),
    contents: el.querySelector(CONTENTS_SELECTOR),
    pieces: [...el.querySelectorAll(PART_SELECTOR)],
  })

  function stop(el: HTMLElement) {
    journey?.kill()
    journey = undefined
    if (holding) gsap.ticker.remove(holding)
    holding = undefined
    const { start, contents, pieces } = parts(el)
    gsap.killTweensOf([el, start, contents, ...pieces].filter(Boolean))
  }

  // Draws the bar at a box on screen, offset from wherever its place in the layout is now
  function placeAt(el: HTMLElement, slot: HTMLElement, box: Box) {
    const layout = slot.getBoundingClientRect()
    gsap.set(el, {
      x: box.centre - (layout.left + layout.width / 2),
      y: box.top - layout.top,
      width: box.width,
      height: box.height,
      borderRadius: box.radius,
    })
  }

  // A timeline that moves the bar from one box to the other on screen, tweening the box itself
  function travel(
    el: HTMLElement,
    slot: HTMLElement,
    from: Box,
    to: Box,
    vars: gsap.TweenVars,
    onComplete: () => void,
  ) {
    const box = { ...from }
    const place = () => placeAt(el, slot, box)

    // Placed at the start now, since a tween only draws from its first tick
    place()
    journey = gsap.timeline({ onComplete }).to(box, { ...to, ...vars, onUpdate: place }, 0)
    return journey
  }

  // Centred on its own width at the screen's centre, so it widens from the middle out, and can overshoot its
  // max-width (and on mobile, its gutters) without being pushed off to one side
  function free(el: HTMLElement) {
    gsap.set(el, { marginLeft: '50%', xPercent: -50, maxWidth: 'none', overflow: 'hidden' })
  }

  // Back to the nav its classes describe. After a render, when shrinking, so it isn't seen at rest for a frame.
  function settle(el: HTMLElement) {
    const { start, contents, pieces } = parts(el)
    gsap.set(el, { clearProps: `${MORPH_PROPS},opacity` })
    gsap.set([start, contents, ...pieces].filter(Boolean), { clearProps: 'opacity,filter' })
  }

  // Shown before the page renders the change, so the nav's there to take over from Start in the same frame
  function begin() {
    morphing.value = true
  }

  // From Start's box to where the nav is pinned. The bar travels and widens on a spring that overshoots by about 2.5%.
  // Start's look fades into the nav's glass as it sets off, its outline drawing in from nothing (Start has none); the nav's own parts come in one after another once it's
  // most of the way there, as the first question does.
  function grow(start: DOMRect, startRadius: number) {
    const el = nav()
    const slot = bar()
    const top = pinnedTop()
    if (!el || !slot || top === undefined) return (morphing.value = false)

    held = undefined
    stop(el)
    settle(el)
    const { start: label, contents, pieces } = parts(el)

    if (reducedMotion.value) {
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.2,
          ease: 'power2.out',
          clearProps: 'opacity',
          onComplete: () => (morphing.value = false),
        },
      )
      return
    }

    const layout = slot.getBoundingClientRect()
    const to = {
      centre: layout.left + layout.width / 2,
      top,
      width: el.offsetWidth,
      height: el.offsetHeight,
      radius: radiusOf(el),
    }
    const outline = getComputedStyle(el).outlineWidth
    free(el)

    travel(el, slot, boxOf(start, startRadius), to, { duration: 0.9, ease: 'elastic.out(1, 1.3)' }, () => {
      morphing.value = false
      settle(el)
    })
      .set(contents, { opacity: 1 }, 0)
      .fromTo(label, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0)
      .fromTo(el, { outlineWidth: 0 }, { outlineWidth: outline, duration: 0.3, ease: 'power1.out' }, 0)
      .fromTo(
        pieces,
        { opacity: 0, filter: 'blur(4px)' },
        { opacity: 1, filter: 'blur(0px)', duration: 0.3, ease: 'power2.out', stagger: 0.06 },
        0.42,
      )
  }

  // The nav's parts fade, ahead of the bar going back up. Start over waits for it before the brief resets, so the
  // thanks screen's buttons aren't seen swapping for the first step's on the way.
  //
  // The bar is held where it is on screen until it shrinks. The intro scrolls the page as it comes in, which would
  // otherwise carry the nav with it: riding up with the brief's end, it would drop to the bottom of the screen first.
  function fade() {
    const el = nav()
    const slot = bar()
    const contents = el?.querySelector(CONTENTS_SELECTOR)
    if (!el || !slot || !contents) return Promise.resolve()

    begin()
    if (!held && !reducedMotion.value) {
      stop(el)
      const box = boxOf(el.getBoundingClientRect(), radiusOf(el))
      held = box
      free(el)
      placeAt(el, slot, box)
      holding = () => placeAt(el, slot, box)
      gsap.ticker.add(holding)
    }

    return new Promise<void>((resolve) => {
      gsap.to(contents, { opacity: 0, duration: 0.12, ease: 'power1.out', onComplete: resolve })
    })
  }

  // To Start's box from wherever the nav is, even partway through growing. Quicker than growing, and settling
  // without an overshoot: the brief is being put away rather than opened. On landing, the nav is hidden and Start
  // shown in its place.
  function shrink(start: DOMRect, startRadius: number) {
    const el = nav()
    const slot = bar()
    if (!el || !slot) return (morphing.value = false)

    // Where it's being held, or else where it's drawn now, partway through growing or not
    const from = held ?? boxOf(el.getBoundingClientRect(), radiusOf(el))
    held = undefined
    stop(el)
    const { start: label, contents } = parts(el)

    const land = () => {
      morphing.value = false
      void nextTick(() => settle(el))
    }

    if (reducedMotion.value) {
      gsap.to(el, { opacity: 0, duration: 0.15, ease: 'power1.out', onComplete: land })
      return
    }

    free(el)

    travel(el, slot, from, boxOf(start, startRadius), { duration: 0.4, ease: 'power3.out' }, land)
      .to(contents, { opacity: 0, duration: 0.12, ease: 'power1.out' }, 0)
      .to(el, { outlineWidth: 0, duration: 0.25, ease: 'power1.out' }, 0.15)
      .fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power1.out' }, 0.15)
  }

  onBeforeUnmount(() => {
    const el = nav()
    if (el) stop(el)
  })

  // Where the bar's top sits when pinned to the bottom of the screen, rather than riding up with the brief's end
  function pinnedTop() {
    const slot = bar()
    if (!slot) return
    return window.innerHeight - Number.parseFloat(getComputedStyle(slot).bottom) - slot.offsetHeight
  }

  // Set going back to the intro: the bar shrinks once the intro has mounted and Start can be measured
  let shrinkPending = false

  // Start pressed: measured and hidden before the intro leaves, then the bar grows out of where it was
  watch(
    () => brief.status,
    async (to, from) => {
      if (from === 'intro' && to === 'draft') {
        const button = startButton()
        if (!button) return
        const rect = button.getBoundingClientRect()
        button.style.visibility = 'hidden'
        begin()
        await nextTick()
        grow(rect, radiusOf(button))
      } else if (to === 'intro') {
        shrinkPending = true
        void fade()
      }
    },
    { flush: 'pre' },
  )

  // For the screen's enter transition: lands the bar on Start where it'll sit once the intro has come in
  function enter(screen: Element) {
    const button = startButton()
    if (shrinkPending && button) shrink(settledRect(button, screen), radiusOf(button))
    shrinkPending = false
  }

  return { morphing, fade, enter }
}

// Where an element inside a brief screen will sit once the screen's enter transition has finished. The screen comes
// in scaled from its top centre (see .brief-back-enter-from), which a measurement now would include.
export function settledRect(el: Element, screen: Element): DOMRect {
  const scale = Number.parseFloat(getComputedStyle(screen).scale) || 1
  const rect = el.getBoundingClientRect()
  if (scale === 1) return rect

  const box = screen.getBoundingClientRect()
  const originX = box.left + box.width / 2
  const originY = box.top

  return new DOMRect(
    originX + (rect.left - originX) / scale,
    originY + (rect.top - originY) / scale,
    rect.width / scale,
    rect.height / scale,
  )
}
