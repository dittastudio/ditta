<script lang="ts" setup>
import { gsap } from 'gsap'
import { useLenis } from 'lenis/vue'

interface Props {
  duration?: string
  direction?: 'left' | 'right'
  spacingClasses?: string
}

const { direction = 'left', duration = '60s', spacingClasses = 'gap-80 px-40' } = defineProps<Props>()

const container = useTemplateRef('container')
const wrappers = useTemplateRef('wrappers')
const lists = useTemplateRef('lists')

const isLeft = direction === 'left'

let xTo: ReturnType<typeof gsap.quickTo> | null = null
// Where the ticker really sits in the page — works even when sticky-pinned.
let documentTop = Number.POSITIVE_INFINITY

let viewportHeight = 0
let containerWidth = 0
let lastIsScrollingUp: boolean | null = null

const refreshDimensions = () => {
  if (!container.value) {
    return
  }

  viewportHeight = window.innerHeight
  containerWidth = container.value.clientWidth
}

const setPlayState = (isScrollingUp: boolean) => {
  const flip = isLeft === isScrollingUp
  const wrapperState = flip ? 'running' : 'paused'
  const listState = flip ? 'paused' : 'running'

  wrappers.value?.forEach((el) => {
    el.style.animationPlayState = wrapperState
  })
  lists.value?.forEach((el) => {
    el.style.animationPlayState = listState
  })
}

onMounted(() => {
  if (!container.value) {
    return
  }

  xTo = gsap.quickTo(container.value, 'x', { duration: 0.5, ease: 'power3' })
  refreshDimensions()
  window.addEventListener('resize', refreshDimensions)

  const rect = container.value.getBoundingClientRect()
  const scroll = window.scrollY

  documentTop = rect.top + scroll

  const range = viewportHeight + rect.height
  const progress = Math.max(0, (scroll + viewportHeight - documentTop) / range)
  const offset = containerWidth * (progress / 3)

  gsap.set(container.value, { x: isLeft ? -offset : offset })

  lastIsScrollingUp = false
  setPlayState(false)
})

useLenis((lenis) => {
  if (!container.value || !xTo) {
    return
  }

  const isScrollingUp = lenis.direction === -1

  if (isScrollingUp !== lastIsScrollingUp) {
    setPlayState(isScrollingUp)
    lastIsScrollingUp = isScrollingUp
  }

  const rect = container.value.getBoundingClientRect()
  const naturalTop = rect.top + lenis.scroll
  if (naturalTop < documentTop) {
    documentTop = naturalTop
  }

  if (rect.bottom < 0 || rect.top > viewportHeight) {
    return
  }

  const range = viewportHeight + rect.height
  // Lower-clamped only — progress is allowed past 1 so momentum continues during sticky pin.
  const progress = Math.max(0, (lenis.scroll + viewportHeight - documentTop) / range)
  const offset = containerWidth * (progress / 3)

  xTo(isLeft ? -offset : offset)
})

onUnmounted(() => {
  window.removeEventListener('resize', refreshDimensions)

  if (container.value) {
    gsap.set(container.value, { clearProps: 'all' })
  }
})
</script>

<template>
  <div class="ui-ticker relative contain-layout w-full isolate">
    <ul
      ref="container"
      class="flex justify-center transform-gpu"
    >
      <li
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
      </li>
    </ul>
  </div>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.ui-ticker {
  --duration: v-bind(duration);
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
