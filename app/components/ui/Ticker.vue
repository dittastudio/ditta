<script lang="ts" setup>
import type { ShallowRef } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface Props {
  duration?: string
  direction?: 'left' | 'right'
  spacingClasses?: string
  triggerEl?: HTMLElement | null
}

const { direction = 'left', duration = '60s', spacingClasses = 'gap-20 px-10', triggerEl } = defineProps<Props>()

const container = useTemplateRef('container')
const wrappers = useTemplateRef('wrappers')
const lists = useTemplateRef('lists')

const MAX_SCROLL_VELOCITY = 3000

let scrollTrigger: ScrollTrigger | null = null
let slntQuickTo: gsap.QuickToFunc | null = null
let wghtQuickTo: gsap.QuickToFunc | null = null
let xQuickSet: ((value: number) => void) | null = null
let containerWidth = 0
let scrollStopTimer: ReturnType<typeof setTimeout> | null = null

const onResize = () => {
  if (container.value) containerWidth = container.value.clientWidth
}

const resetFontAxes = () => {
  slntQuickTo?.(0)
  wghtQuickTo?.(400)
  scrollStopTimer = null
}

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)

  if (!container.value) {
    return
  }

  gsap.set(container.value, { '--slnt': 0, '--wght': 400 })
  slntQuickTo = gsap.quickTo(container.value, '--slnt', { duration: 0.4, ease: 'power2.out' })
  wghtQuickTo = gsap.quickTo(container.value, '--wght', { duration: 0.4, ease: 'power2.out' })
  xQuickSet = gsap.quickSetter(container.value, 'x', 'px') as (value: number) => void
  containerWidth = container.value.clientWidth
  window.addEventListener('resize', onResize, { passive: true })

  let lastProgress = 0

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

      // Update animation states
      if (wrappers.value) {
        wrappers.value.forEach((wrapper) => {
          wrapper.style.animationPlayState = isScrollingUp
            ? direction === 'left'
              ? 'running'
              : 'paused'
            : direction === 'left'
              ? 'paused'
              : 'running'
        })
      }

      if (lists.value) {
        lists.value.forEach((list) => {
          list.style.animationPlayState = isScrollingUp
            ? direction === 'left'
              ? 'paused'
              : 'running'
            : direction === 'left'
              ? 'running'
              : 'paused'
        })
      }

      const velocity = self.getVelocity()
      const t = Math.min(Math.abs(velocity) / MAX_SCROLL_VELOCITY, 1)

      if (velocity > 0) {
        slntQuickTo?.(-10 * t)
        wghtQuickTo?.(400)
      } else if (velocity < 0) {
        slntQuickTo?.(0)
        wghtQuickTo?.(400 + 900 * t)
      }

      if (scrollStopTimer !== null) clearTimeout(scrollStopTimer)
      scrollStopTimer = setTimeout(resetFontAxes, 150)

      lastProgress = progress

      xQuickSet?.(direction === 'left' ? -containerWidth * (progress * 2) + 1 : containerWidth * (progress * 2) - 1)
    },
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)

  if (scrollStopTimer !== null) {
    clearTimeout(scrollStopTimer)
    scrollStopTimer = null
  }

  if (scrollTrigger) {
    scrollTrigger.kill()
    scrollTrigger = null
  }

  // Reset GSAP properties
  if (container.value) {
    gsap.set(container.value, { clearProps: 'all' })
  }
})
</script>

<template>
  <div class="ui-ticker relative contain-layout w-full isolate">
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

.ui-ticker {
  --duration: v-bind(duration);
}

.ui-ticker__container {
  font-variation-settings:
    'slnt' var(--slnt, 0),
    'wght' var(--wght, 400);
}

.ui-ticker__wrapper {
  animation: ticker-right var(--duration) linear infinite paused;
}

.ui-ticker__list {
  animation: ticker-left var(--duration) linear infinite paused;
}

@keyframes ticker-left {
  0% {
    translate: 0 0 0;
  }

  100% {
    translate: -100% 0 0;
  }
}

@keyframes ticker-right {
  0% {
    translate: 0 0 0;
  }

  100% {
    translate: 100% 0 0;
  }
}
</style>
