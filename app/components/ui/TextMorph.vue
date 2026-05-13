<script lang="ts" setup>
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

// Shared scroll singleton — one listener + one rAF for all instances on the page
const scrollCallbacks = new Set<() => void>()
let _scrollPending = false
const _onScrollGlobal = () => {
  if (_scrollPending) return
  _scrollPending = true
  requestAnimationFrame(() => {
    scrollCallbacks.forEach((cb) => cb())
    _scrollPending = false
  })
}

interface Props {
  text: string
  falloff?: number
  minWeight?: number
  maxWeight?: number
  autoAnimate?: boolean
}

const { text, falloff = 1.5, minWeight = 300, maxWeight = 900, autoAnimate = true } = defineProps<Props>()

// em values — negative = pull left (tighten). tune per font.
const KERNING_MAP: Record<string, number> = {
  // ── Cap + Cap ──────────────────────────────────────────────
  AV: -0.08,
  AW: -0.07,
  AT: -0.07,
  AY: -0.08,
  VA: -0.08,
  WA: -0.07,
  TA: -0.07,
  YA: -0.08,
  LT: -0.07,
  LY: -0.07,
  FA: -0.06,
  PA: -0.04,
  // ── Cap + lower ────────────────────────────────────────────
  Av: -0.08,
  Aw: -0.07,
  Ay: -0.08,
  Ta: -0.07,
  Te: -0.07,
  To: -0.07,
  Tv: -0.07,
  Ty: -0.07,
  Va: -0.07,
  Ve: -0.06,
  Vo: -0.06,
  Wa: -0.06,
  We: -0.05,
  Wo: -0.05,
  Ya: -0.07,
  Ye: -0.06,
  Yo: -0.06,
  // ── lower + lower ──────────────────────────────────────────
  av: -0.04,
  aw: -0.04,
  ay: -0.04,
  va: -0.04,
  vo: -0.03,
  wa: -0.04,
  wo: -0.03,
}

const applyKerning = (chars: Element[]) => {
  for (let i = 1; i < chars.length; i++) {
    const prev = chars[i - 1]!.textContent ?? ''
    const curr = chars[i]!.textContent ?? ''
    const kern = KERNING_MAP[prev + curr]
    if (kern !== undefined) {
      ;(chars[i] as HTMLElement).style.marginLeft = `${kern}em`
    }
  }
}

const rootRef = useTemplateRef('rootRef')

let falloffPx = 220
const MIN_SLNT = 0
const MAX_SLNT = -10
const TWEEN = { duration: 0.3, ease: 'power2.out' }
const AUTO_TWEEN = { duration: 2, ease: 'power2.inOut' }
const falloffEase = gsap.parseEase('power2.inOut')

let split: SplitText | null = null
let centers: number[] = []
let wghtSetters: ((v: number) => gsap.core.Tween)[] = []
let slntSetters: ((v: number) => gsap.core.Tween)[] = []
let ro: ResizeObserver | null = null

let pointerX = 0
let isHovered = false
let dirty = false

// Auto-sweep uses a normalised 0→1 progress value. tick() converts it to viewport X
// using autoStartX/autoEndX, which measure() keeps current after every resize.
const autoProxy = { progress: 0 }
let autoActive = false
let autoStartX = 0
let autoEndX = 0
let autoTl: gsap.core.Tween | null = null
let autoDelayedCall: gsap.core.Tween | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null
let isVisible = false
let io: IntersectionObserver | null = null
let scrollMeasure: (() => void) | null = null

const onResize = () => {
  if (resizeTimer !== null) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(measure, 150)
}

const measure = () => {
  const chars = split?.chars
  if (!chars) return
  centers = chars.map((el) => {
    const rect = el.getBoundingClientRect()
    return rect.left + rect.width / 2
  })
  falloffPx = falloff * parseFloat(getComputedStyle(rootRef.value!).fontSize)
  autoStartX = (centers[0] ?? 0) - falloffPx
  autoEndX = (centers[centers.length - 1] ?? 0) + falloffPx
  dirty = true
}

const startAutoLoop = () => {
  autoDelayedCall = null
  autoProxy.progress = 0
  autoActive = true

  autoTl = gsap.fromTo(
    autoProxy,
    { progress: 0 },
    {
      progress: 1,
      duration: AUTO_TWEEN.duration,
      ease: AUTO_TWEEN.ease,
      repeat: -1,
      repeatDelay: 3,
      onUpdate() {
        dirty = true
      },
      onRepeat() {
        dirty = true
      },
    },
  )
}

const onMove = (e: PointerEvent) => {
  pointerX = e.clientX
  isHovered = true
  dirty = true
  autoDelayedCall?.kill()
  autoTl?.pause()
}

const onLeave = () => {
  isHovered = false
  dirty = true

  const exitProgress = Math.max(0, Math.min(1, (pointerX - autoStartX) / (autoEndX - autoStartX)))

  autoTl?.kill()
  autoProxy.progress = exitProgress

  autoActive = true

  autoTl = gsap.fromTo(
    autoProxy,
    { progress: exitProgress },
    {
      progress: 1,
      duration: AUTO_TWEEN.duration * (1 - exitProgress),
      ease: AUTO_TWEEN.ease,
      onUpdate() {
        dirty = true
      },
      onComplete() {
        if (autoAnimate) {
          autoDelayedCall = gsap.delayedCall(2, startAutoLoop)
        } else {
          autoActive = false
          dirty = true
        }
      },
    },
  )
}

const tick = () => {
  if (!dirty) return
  dirty = false

  const len = split?.chars.length ?? 0
  const currentX = isHovered ? pointerX : autoStartX + autoProxy.progress * (autoEndX - autoStartX)
  const isActive = isHovered || autoActive

  for (let i = 0; i < len; i++) {
    let eased = 0

    if (isActive) {
      const dist = Math.abs(currentX - (centers[i] ?? 0))
      const proximity = Math.max(0, 1 - dist / falloffPx)
      eased = falloffEase(proximity)
      if (eased < 0.01) eased = 0
    }

    wghtSetters[i]?.(minWeight + eased * (maxWeight - minWeight))
    slntSetters[i]?.(MIN_SLNT + eased * (MAX_SLNT - MIN_SLNT))
  }
}

onMounted(() => {
  if (!rootRef.value) return

  split = new SplitText(rootRef.value, { type: 'chars', charsClass: 'text-morph__char' })
  const chars = split.chars

  gsap.set(chars, { '--wght': minWeight, '--slnt': MIN_SLNT })
  applyKerning(chars)
  const round1dp = (v: string) => String(Math.round(parseFloat(v) * 10) / 10)
  wghtSetters = chars.map((el) => gsap.quickTo(el, '--wght', { ...TWEEN, modifiers: { '--wght': round1dp } }))
  slntSetters = chars.map((el) => gsap.quickTo(el, '--slnt', { ...TWEEN, modifiers: { '--slnt': round1dp } }))

  measure()
  document.fonts.ready.then(() => measure())
  if (autoAnimate) startAutoLoop()

  ro = new ResizeObserver(measure)
  ro.observe(rootRef.value)

  io = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0]?.isIntersecting ?? false
      if (isVisible) measure()
    },
    { threshold: 0 },
  )
  io.observe(rootRef.value)

  scrollMeasure = () => {
    if (isVisible) measure()
  }
  scrollCallbacks.add(scrollMeasure)
  if (scrollCallbacks.size === 1) window.addEventListener('scroll', _onScrollGlobal, { passive: true })

  window.addEventListener('resize', onResize, { passive: true })

  gsap.ticker.add(tick)
})

onUnmounted(() => {
  autoDelayedCall?.kill()
  autoTl?.kill()
  ro?.disconnect()
  io?.disconnect()
  if (scrollMeasure) {
    scrollCallbacks.delete(scrollMeasure)
    if (scrollCallbacks.size === 0) window.removeEventListener('scroll', _onScrollGlobal)
  }
  window.removeEventListener('resize', onResize)
  if (resizeTimer !== null) clearTimeout(resizeTimer)
  gsap.ticker.remove(tick)
  if (split) {
    for (const el of split.chars) gsap.killTweensOf(el)
    split.revert()
  }
})
</script>

<template>
  <span
    ref="rootRef"
    @pointermove.passive="onMove"
    @pointerleave="onLeave"
  >
    {{ text }}
  </span>
</template>

<style>
.text-morph__char {
  display: inline-block;
  font-variation-settings:
    'slnt' var(--slnt, 0),
    'wght' var(--wght, 300);
  will-change: font-variation-settings;
}
</style>
