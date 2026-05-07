<script lang="ts" setup>
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

interface Props {
  text: string
}

const { text } = defineProps<Props>()

const rootRef = useTemplateRef('rootRef')

const FALLOFF = 220
const MIN_WGHT = 300
const MAX_WGHT = 900
const MIN_ITAL = 0
const MAX_ITAL = 10
const TWEEN = { duration: 0.3, ease: 'power2.out' }
const AUTO_TWEEN = { duration: 2, ease: 'power2.inOut' }
const falloffEase = gsap.parseEase('power2.inOut')

let split: SplitText | null = null
let centers: number[] = []
let wghtSetters: ((v: number) => gsap.core.Tween)[] = []
let italSetters: ((v: number) => gsap.core.Tween)[] = []
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
  autoStartX = (centers[0] ?? 0) - FALLOFF
  autoEndX = (centers[centers.length - 1] ?? 0) + FALLOFF
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
        autoDelayedCall = gsap.delayedCall(2, startAutoLoop)
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
      const proximity = Math.max(0, 1 - dist / FALLOFF)
      eased = falloffEase(proximity)
      if (eased < 0.01) eased = 0
    }

    wghtSetters[i]?.(MIN_WGHT + eased * (MAX_WGHT - MIN_WGHT))
    italSetters[i]?.(MIN_ITAL + eased * (MAX_ITAL - MIN_ITAL))
  }
}

onMounted(() => {
  if (!rootRef.value) return

  split = new SplitText(rootRef.value, { type: 'chars', charsClass: 'text-morph__char' })
  const chars = split.chars

  gsap.set(chars, { '--wght': MIN_WGHT, '--ital': MIN_ITAL })
  const round1dp = (v: string) => String(Math.round(parseFloat(v) * 10) / 10)
  wghtSetters = chars.map((el) => gsap.quickTo(el, '--wght', { ...TWEEN, modifiers: { '--wght': round1dp } }))
  italSetters = chars.map((el) => gsap.quickTo(el, '--ital', { ...TWEEN, modifiers: { '--ital': round1dp } }))

  measure()
  startAutoLoop()

  ro = new ResizeObserver(measure)
  ro.observe(rootRef.value)
  window.addEventListener('resize', onResize, { passive: true })

  gsap.ticker.add(tick)
})

onUnmounted(() => {
  autoDelayedCall?.kill()
  autoTl?.kill()
  ro?.disconnect()
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
    'ital' var(--ital, 0),
    'wght' var(--wght, 300);
  will-change: font-variation-settings;
}
</style>
