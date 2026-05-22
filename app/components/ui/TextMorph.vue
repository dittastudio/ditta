<script lang="ts" setup>
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

interface Props {
  text: string
  falloff?: number
  minWeight?: number
  maxWeight?: number
  autoAnimate?: boolean
}

const { text, falloff = 1.5, minWeight = 300, maxWeight = 900, autoAnimate = true } = defineProps<Props>()

const MIN_SLNT = 0
const MAX_SLNT = -10
const TWEEN = { duration: 0.3, ease: 'power2.out' }
const AUTO_TWEEN = { duration: 2, ease: 'power2.inOut' }
const falloffEase = gsap.parseEase('power2.inOut')

// em offsets — negative pulls left (tighter). tuned per font.
const KERNING_MAP: Record<string, number> = {
  // ── Cap + Cap ──────────────────────────────────────────────
  AV: -0.08,
  AW: -0.045,
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
  Lu: -0.015,
  Pa: -0.015,
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
  Ye: -0.11,
  Yo: -0.06,
  // ── Space pairs ────────────────────────────────────────────
  ' W': -0.07,
  // ── lower + lower ──────────────────────────────────────────
  av: -0.02,
  aw: -0.04,
  ay: -0.04,
  el: -0.005,
  ll: -0.005,
  lo: -0.015,
  tu: -0.01,
  va: -0.04,
  ve: -0.02,
  vo: -0.03,
  wa: -0.04,
  wo: -0.03,
}

const applyKerning = (chars: Element[]) => {
  const preceding: string[] = []
  let lastNonSpace = ''
  let lastWasSpace = false

  for (const c of text) {
    if (c === ' ') {
      lastWasSpace = true
    } else {
      preceding.push(lastWasSpace ? ' ' : lastNonSpace)
      lastNonSpace = c
      lastWasSpace = false
    }
  }

  for (let i = 0; i < chars.length; i++) {
    const prev = preceding[i] ?? ''
    if (!prev) continue
    const curr = chars[i]!.textContent ?? ''
    const kern = KERNING_MAP[prev + curr]
    if (kern !== undefined) {
      ;(chars[i] as HTMLElement).style.marginLeft = `${kern}em`
    }
  }
}

const rootRef = useTemplateRef('rootRef')

let split: SplitText | null = null
let centers: number[] = []
let wghtSetters: gsap.QuickToFunc[] = []
let slntSetters: gsap.QuickToFunc[] = []
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null

let falloffPx = 220
let autoStartX = 0
let autoEndX = 0

let pointerX = 0
let isHovered = false
let dirty = false

// 0 → 1 normalised sweep position; tick() maps it to a viewport X coordinate
const autoProxy = { progress: 0 }
let autoActive = false
let autoTl: gsap.core.Tween | null = null
let autoDelayedCall: gsap.core.Tween | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null

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

const onResize = () => {
  if (resizeTimer !== null) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(measure, 150)
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

const onMove = (e: PointerEvent) => {
  if (!isHovered) {
    gsap.set(split?.chars ?? [], { willChange: 'font-variation-settings' })
  }

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
          gsap.set(split?.chars ?? [], { willChange: 'auto' })
        }
      },
    },
  )
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

  if (autoAnimate) startAutoLoop()

  ro = new ResizeObserver(onResize)
  ro.observe(rootRef.value)

  io = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        measure()
        if (autoAnimate) {
          gsap.set(chars, { willChange: 'font-variation-settings' })
          autoDelayedCall?.kill()
          autoTl?.kill()
          startAutoLoop()
        }
      } else {
        autoDelayedCall?.kill()
        autoTl?.kill()
        autoActive = false
        dirty = true
        if (autoAnimate) gsap.set(chars, { willChange: 'auto' })
      }
    },
    { threshold: 0 },
  )
  io.observe(rootRef.value)

  gsap.ticker.add(tick)
})

onUnmounted(() => {
  autoDelayedCall?.kill()
  autoTl?.kill()
  ro?.disconnect()
  io?.disconnect()
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
}
</style>
