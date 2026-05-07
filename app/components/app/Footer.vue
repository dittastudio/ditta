<script lang="ts" setup>
import type { StoryblokRichtext } from '#storyblok-types'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

interface Props {
  text?: StoryblokRichtext
}

const { text } = defineProps<Props>()

const email = 'hello@ditta.studio'

const linkRef = useTemplateRef('linkRef')

const FALLOFF = 240
const MIN_WGHT = 300
const MAX_WGHT = 900
const MIN_ITAL = 0
const MAX_ITAL = 10
const TWEEN = { duration: 0.4, ease: 'power2.out' }
const falloffEase = gsap.parseEase('power2.inOut')

let split: SplitText | null = null
let centers: number[] = []
let wghtSetters: ((v: number) => gsap.core.Tween)[] = []
let italSetters: ((v: number) => gsap.core.Tween)[] = []
let ro: ResizeObserver | null = null

let pointerX = 0
let active = false
let dirty = false

const measure = () => {
  const chars = split?.chars
  if (!chars) return
  centers = chars.map((el) => {
    const rect = el.getBoundingClientRect()
    return rect.left + rect.width / 2
  })
}

const onMove = (e: PointerEvent) => {
  pointerX = e.clientX
  active = true
  dirty = true
}

const onLeave = () => {
  active = false
  dirty = true
}

const tick = () => {
  if (!dirty) return
  dirty = false

  const len = split?.chars.length ?? 0

  for (let i = 0; i < len; i++) {
    let eased = 0

    if (active) {
      const dist = Math.abs(pointerX - (centers[i] ?? 0))
      const proximity = Math.max(0, 1 - dist / FALLOFF)
      eased = falloffEase(proximity)
      if (eased < 0.01) eased = 0
    }

    wghtSetters[i]?.(MIN_WGHT + eased * (MAX_WGHT - MIN_WGHT))
    italSetters[i]?.(MIN_ITAL + eased * (MAX_ITAL - MIN_ITAL))
  }
}

onMounted(() => {
  if (!linkRef.value) return

  split = new SplitText(linkRef.value, { type: 'chars', charsClass: 'footer__char' })
  const chars = split.chars

  gsap.set(chars, { '--wght': MIN_WGHT, '--ital': MIN_ITAL })
  wghtSetters = chars.map((el) => gsap.quickTo(el, '--wght', TWEEN))
  italSetters = chars.map((el) => gsap.quickTo(el, '--ital', TWEEN))

  measure()

  ro = new ResizeObserver(measure)
  ro.observe(linkRef.value)

  gsap.ticker.add(tick)
})

onUnmounted(() => {
  ro?.disconnect()
  gsap.ticker.remove(tick)
  if (split) {
    for (const el of split.chars) gsap.killTweensOf(el)
    split.revert()
  }
})
</script>

<template>
  <footer class="bg-black text-grey min-h-screen flex">
    <div class="wrapper w-full pt-25 md:pt-(--app-gutter-outer) pb-10 flex flex-col justify-between gap-6">
      <div
        v-if="storyblokRichTextContent(text)"
        :class="[
          'prose',
          'text-pretty',
          'prose-h2:text-heading',
          'prose-h2:max-w-[18em]',
          'prose-p:text-lead',
          'prose-p:text-beige',
          'prose-p:max-w-[23em]',
        ]"
      >
        <StoryblokText :html="text" />
      </div>

      <a
        ref="linkRef"
        class="footer__link block whitespace-nowrap text-center"
        href="mailto:hello@ditta.studio"
        aria-label="Email Ditta at hello@ditta.studio"
        @pointermove.passive="onMove"
        @pointerleave="onLeave"
      >
        {{ email }}
      </a>
    </div>
  </footer>
</template>

<style scoped>
.footer__link {
  font-size: min(calc(9.5vw + 6px), 176px); /* magic number */
}

.footer__link :deep(.footer__char) {
  display: inline-block;
  font-variation-settings:
    'ital' var(--ital, 0),
    'wght' var(--wght, 300);
  will-change: font-variation-settings;
}
</style>
