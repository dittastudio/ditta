<script lang="ts" setup>
import { useIntersectionObserver, useResizeObserver } from '@vueuse/core'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  duration?: number
  direction?: 'left' | 'right'
  spacingClasses?: string
  speed?: number
  triggerEl?: HTMLElement | null
}

const {
  direction = 'left',
  duration = 60,
  spacingClasses = 'gap-20 px-10',
  speed = 2,
  triggerEl,
} = defineProps<Props>()

const root = useTemplateRef('root')
const container = useTemplateRef('container')
const wrappers = useTemplateRef('wrappers')
const lists = useTemplateRef('lists')

const MAX_SCROLL_VELOCITY = 1000
const MIN_VELOCITY = 50

let scrollTrigger: ScrollTrigger | null = null
let skewXQuickTo: gsap.QuickToFunc | null = null
let xQuickTo: gsap.QuickToFunc | null = null
let wrapperTweens: gsap.core.Tween[] = []
let listTweens: gsap.core.Tween[] = []
let containerWidth = 0
let lastIsScrollingUp: boolean | null = null

const createWrapperTween = (el: HTMLElement, duration: number) => {
  return gsap.to(el, {
    xPercent: 100,
    duration,
    ease: 'none',
    repeat: -1,
    paused: true,
    force3D: true,
  })
}

const createListTween = (el: HTMLElement, duration: number) => {
  return gsap.to(el, {
    xPercent: -100,
    duration,
    ease: 'none',
    repeat: -1,
    paused: true,
    force3D: true,
  })
}

useIntersectionObserver(
  root,
  ([entry]) => {
    if (!entry) return

    if (!entry.isIntersecting) {
      wrapperTweens.forEach((t) => t.pause())
      listTweens.forEach((t) => t.pause())
      lastIsScrollingUp = null
    }
  },
  { rootMargin: '200px 0px 200px 0px' },
)

const onResize = () => {
  if (!container.value) return
  containerWidth = container.value.clientWidth
  scrollTrigger?.refresh()
}

onMounted(async () => {
  await nextTick()

  if (!container.value) {
    return
  }

  gsap.set(root.value, { skewX: 0, force3D: true })
  gsap.set(container.value, { force3D: true })
  skewXQuickTo = gsap.quickTo(root.value, 'skewX', { duration: 0.4, ease: 'power2.out', force3D: true })
  xQuickTo = gsap.quickTo(container.value, 'x', { duration: 0.3, ease: 'power2.out', force3D: true })
  containerWidth = container.value.clientWidth

  useResizeObserver(container, onResize)

  let lastProgress = 0

  wrapperTweens = (wrappers.value ?? []).map((el) => createWrapperTween(el, duration))
  listTweens = (lists.value ?? []).map((el) => createListTween(el, duration))

  scrollTrigger = ScrollTrigger.create({
    trigger: triggerEl ?? container.value,
    start: 'top bottom',
    end: 'bottom top',
    scrub: false,
    markers: false,
    onUpdate: (self) => {
      if (!container.value) {
        return
      }

      const progress = self.progress
      const isScrollingUp = progress < lastProgress

      if (isScrollingUp !== lastIsScrollingUp) {
        const wrapperRunning = isScrollingUp === (direction === 'left')

        wrapperTweens.forEach((t) => (wrapperRunning ? t.play() : t.pause()))
        listTweens.forEach((t) => (wrapperRunning ? t.pause() : t.play()))

        lastIsScrollingUp = isScrollingUp
      }

      const velocity = self.getVelocity()
      const absVelocity = Math.abs(velocity)

      if (absVelocity > MIN_VELOCITY) {
        const t = Math.min(absVelocity / MAX_SCROLL_VELOCITY, 1)
        skewXQuickTo?.(isScrollingUp ? -6 * t : 6 * t)
      } else {
        skewXQuickTo?.(0)
      }

      lastProgress = progress

      xQuickTo?.(
        direction === 'left' ? -containerWidth * (progress * speed) + 1 : containerWidth * (progress * speed) - 1,
      )
    },
  })
})

onUnmounted(() => {
  if (scrollTrigger) {
    scrollTrigger.kill()
    scrollTrigger = null
  }

  wrapperTweens.forEach((t) => t.kill())
  listTweens.forEach((t) => t.kill())
  wrapperTweens = []
  listTweens = []

  if (root.value) {
    gsap.set(root.value, { clearProps: 'skewX' })
  }

  if (container.value) {
    gsap.set(container.value, { clearProps: 'x' })
  }
})
</script>

<template>
  <div
    ref="root"
    class="ui-ticker relative contain-layout w-full isolate"
  >
    <div
      ref="container"
      class="ui-ticker__container flex justify-center"
    >
      <div
        v-for="i in 4"
        :key="i"
        ref="wrappers"
        class="ui-ticker__wrapper min-w-full shrink-0"
      >
        <div
          ref="lists"
          class="ui-ticker__list select-none flex justify-center shrink-0 min-w-full"
        >
          <div
            :class="spacingClasses"
            class="flex shrink-0 items-center justify-around min-w-full"
          >
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
