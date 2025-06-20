<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const REPEAT_COUNT = 9
const SKEW_CLAMP_MIN = -20
const SKEW_CLAMP_MAX = 20
const VELOCITY_DIVISOR = -250
const SKEW_DURATION = 1

export interface Props {
  copy: string[]
  duration?: string
  direction?: 'left' | 'right'
  isLast?: boolean
  hasBorder?: boolean
}

const { copy, direction = 'left', duration = '60s', isLast = false, hasBorder = true } = defineProps<Props>()

const container = ref<HTMLElement | null>(null)
const wrappers = ref<HTMLElement[]>([])
const lists = ref<HTMLElement[]>([])
let scrollTrigger: ScrollTrigger | null = null

// Optimize array creation
const multipleWords = computed(() => {
  return Array.from({ length: REPEAT_COUNT }).fill(copy).flat()
})

onMounted(() => {
  if (!container.value)
    return

  const proxy = { skew: 0 }
  const skewSetter = gsap.quickSetter(container.value, 'skewX', 'deg')
  const clamp = gsap.utils.clamp(SKEW_CLAMP_MIN, SKEW_CLAMP_MAX)
  let lastProgress = 0

  scrollTrigger = ScrollTrigger.create({
    onUpdate: (self) => {
      if (!container.value)
        return

      const skew = clamp(self.getVelocity() / VELOCITY_DIVISOR)

      if (Math.abs(skew) > Math.abs(proxy.skew)) {
        proxy.skew = skew
        gsap.to(proxy, {
          skew: 0,
          duration: SKEW_DURATION,
          ease: 'power3',
          overwrite: true,
          onUpdate: () => skewSetter(proxy.skew),
        })
      }

      const progress = self.progress
      const isScrollingUp = progress < lastProgress

      // Update animation states
      wrappers.value.forEach((wrapper) => {
        wrapper.style.animationPlayState = isScrollingUp
          ? (direction === 'left' ? 'running' : 'paused')
          : (direction === 'left' ? 'paused' : 'running')
      })

      lists.value.forEach((list) => {
        list.style.animationPlayState = isScrollingUp
          ? (direction === 'left' ? 'paused' : 'running')
          : (direction === 'left' ? 'running' : 'paused')
      })

      lastProgress = progress

      gsap.to(container.value, {
        x: direction === 'left'
          ? -container.value.clientWidth * progress + 1
          : container.value.clientWidth * progress - 1,
      })
    },
  })
})

onUnmounted(() => {
  if (scrollTrigger) {
    scrollTrigger.kill()
    scrollTrigger = null
  }
})
</script>

<template>
  <div
    v-if="copy"
    class="ui-ticker contain-layout w-full isolate"
    :class="{ 'ui-ticker--last': isLast, 'ui-ticker--has-border': hasBorder }"
  >
    <div
      ref="container"
      class="flex justify-center transform-gpu"
    >
      <div
        v-for="i in 4"
        :key="i"
        ref="wrappers"
        class="ui-ticker__wrapper type-fluid-lg lowercase min-w-full shrink-0 transform-gpu"
      >
        <div
          ref="lists"
          class="ui-ticker__list select-none flex justify-center shrink-0 min-w-full transform-gpu"
        >
          <div
            class="ui-ticker__words flex shrink-0 items-center justify-around min-w-full"
          >
            <p
              v-for="(word, index) in multipleWords"
              :key="index"
              class="ui-ticker__copy block font-[inherit]"
            >
              {{ word }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.ui-ticker {
  --duration: v-bind(duration);

  position: relative;

  &--has-border::before,
  &--has-border::after {
    position: absolute;
    right: 0;
    left: 0;

    width: calc(100% - (var(--app-outer-gutter) * 2));
    height: 1px;
    margin-inline: auto;

    opacity: 0.2;
    background-color: currentColor;
  }

  &--has-border::before {
    content: '';
    top: 0;
  }

  &--has-border.ui-ticker--last::after {
    content: '';
    bottom: 0;
  }
}

.ui-ticker__wrapper {
  animation: ticker-right var(--duration) linear infinite paused;
}

.ui-ticker__list {
  animation: ticker-left var(--duration) linear infinite paused;
}

.ui-ticker__words {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
  padding: 0.2em 0.2em;
}

.ui-ticker__copy {
  margin-block: -0.147em -0.013em;
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
