<script lang="ts" setup>
import { useIntersectionObserver } from '@vueuse/core'
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
let resizeObserver: ResizeObserver | null = null
let skewXQuickTo: gsap.QuickToFunc | null = null
let xQuickTo: gsap.QuickToFunc | null = null
let wrapperTweens: gsap.core.Tween[] = []
let listTweens: gsap.core.Tween[] = []
let containerWidth = 0
let lastIsScrollingUp: boolean | null = null

useIntersectionObserver(root, ([entry]) => {
  if (!entry.isIntersecting) {
    wrapperTweens.forEach((t) => t.pause())
    listTweens.forEach((t) => t.pause())
    lastIsScrollingUp = null
  }
})

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

  gsap.set(root.value, { skewX: 0 })
  skewXQuickTo = gsap.quickTo(root.value, 'skewX', { duration: 0.4, ease: 'power2.out' })
  xQuickTo = gsap.quickTo(container.value, 'x', { duration: 0.3, ease: 'power2.out' })
  containerWidth = container.value.clientWidth

  resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(container.value)

  let lastProgress = 0

  wrapperTweens = (wrappers.value ?? []).map((wrapper) =>
    gsap.to(wrapper, {
      xPercent: 100,
      duration,
      ease: 'none',
      repeat: -1,
      paused: true,
      force3D: true,
    }),
  )

  listTweens = (lists.value ?? []).map((list) =>
    gsap.to(list, {
      xPercent: -100,
      duration,
      ease: 'none',
      repeat: -1,
      paused: true,
      force3D: true,
    }),
  )

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
  resizeObserver?.disconnect()
  resizeObserver = null

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
    gsap.set(container.value, { clearProps: 'all' })
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
      class="ui-ticker__container flex justify-center transform-gpu"
    >
      <div
        v-for="i in 4"
        :key="i"
        ref="wrappers"
        class="ui-ticker__wrapper min-w-full shrink-0 transform-gpu"
      >
        <div
          ref="lists"
          class="ui-ticker__list select-none flex justify-center shrink-0 min-w-full transform-gpu"
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

<style scoped>
@reference "@/assets/css/app.css";

.ui-ticker__wrapper {
  will-change: transform;
  backface-visibility: hidden;
}

.ui-ticker__list {
  will-change: transform;
  backface-visibility: hidden;
}
</style>
