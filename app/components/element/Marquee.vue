<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useIntersectionObserver } from '@vueuse/core'
import { colourBackground, colourText } from '@/utilities/maps'

gsap.registerPlugin(ScrollTrigger)

export interface Props {
  backgroundColor?: string
  textColor?: string
  textSize?: 'bento' | 'large'
  copy: string[]
  duration?: string
  direction?: 'left' | 'right'
}

const {
  backgroundColor = 'offwhite',
  textColor = 'offblack',
  textSize = 'large',
  copy = [],
  direction = 'left',
  duration = '60s',
} = defineProps<Props>()

const isVisible = ref(false)
const el = ref<HTMLDivElement | null>(null)
const container = ref<HTMLDivElement | null>(null)

useIntersectionObserver(
  el,
  ([{ isIntersecting }]) => {
    console.log('isVisible', isVisible.value)
    isVisible.value = isIntersecting
  },
  { rootMargin: '0px 0px 0px 0px', threshold: 0.5 },
)

const triggerSkew = () => {
  const proxy = { skew: 0 }
  const skewSetter = gsap.quickSetter(container.value, 'skewX', 'deg') // fast
  const clamp = gsap.utils.clamp(-20, 20)

  ScrollTrigger.create({
    onUpdate: (self) => {
      const skew = clamp(self.getVelocity() / -250)

      if (Math.abs(skew) > Math.abs(proxy.skew)) {
        proxy.skew = skew
        gsap.to(proxy, { skew: 0, duration: 1, ease: 'power3', overwrite: true, onUpdate: () => skewSetter(proxy.skew) })
      }
    },
  })

  gsap.set(container.value, { transformOrigin: 'right center', force3D: true })
}

watch(isVisible, () => {
  if (isVisible.value)
    triggerSkew()
})

// onMounted(() => {
//   if (isVisible.value)
//     triggerSkew()
// })

const multipleWords: string[] = [...copy, ...copy, ...copy, ...copy, ...copy, ...copy, ...copy, ...copy, ...copy]
</script>

<template>
  <div
    v-if="copy"
    ref="el"
    class="block-marquee transform-gpu backface-hidden contain-paint block w-full"
    :class="[colourBackground[backgroundColor], colourText[textColor], { 'is-visible': isVisible }]"
  >
    <div
      ref="container"
      class="block-marquee__wrapper"
    >
      <div
        class="block-marquee__words uppercase select-none flex gap-[var(--gap)] min-w-full"
        :class="[
          textSize === 'bento' ? 'text-fluid-zero-sm sm:text-fluid-sm-md italic' : 'text-fluid-lg',
          { [`block-marquee__words--${direction}`]: direction },
        ]"
      >
        <div class="block-marquee__group will-change-transform flex shrink-0 gap-[var(--gap)] items-center justify-around min-w-full">
          <p
            v-for="(word, index) in multipleWords"
            :key="word"
            :aria-hidden="index > 0 ? true : undefined"
          >
            {{ word }}
          </p>
        </div>

        <div
          aria-hidden="true"
          class="block-marquee__group  will-change-transform flex shrink-0 gap-[var(--gap)] items-center justify-around min-w-full"
        >
          <p
            v-for="word in multipleWords"
            :key="word"
          >
            {{ word }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.block-marquee__words {
  --duration: v-bind(duration);
  --gap: 0.5em;

  padding: 0.15em;

  &--left {
    animation: auto linear scroll-left both;
    animation-play-state: paused;
    animation-timeline: view();

    animation-range: entry 0% cover 100%;
  }

  &--right {
    justify-content: flex-end;

    animation: auto linear scroll-right both;
    animation-play-state: paused;
    animation-timeline: view();

    animation-range: entry 0% cover 100%;
  }

  @media not (prefers-reduced-motion: reduce) {
    .block-marquee.is-visible & {
      animation-play-state: running;
    }
  }
}

.block-marquee__group {
  margin-block: -0.088em -0.181em;

  .block-marquee__words--left & {
    animation: ticker-left var(--duration) linear infinite;
    animation-play-state: paused;
  }

  .block-marquee__words--right & {
    animation: ticker-right var(--duration) linear infinite;
    animation-play-state: paused;
  }

  @media not (prefers-reduced-motion: reduce) {
    .block-marquee.is-visible & {
      animation-play-state: running;
    }
  }
}

@keyframes scroll-left {
  from {
    translate: 0% 0 0;
  }

  to {
    translate: -25% 0 0;
  }
}

@keyframes scroll-right {
  from {
    translate: 0% 0 0;
  }

  to {
    translate: 25% 0 0;
  }
}

@keyframes ticker-left {
  0% {
    translate: 0 0 0;
  }

  100% {
    translate: calc(-100% - var(--gap)) 0 0;
  }
}

@keyframes ticker-right {
  0% {
    translate: 0 0 0;
  }

  100% {
    translate: calc(100% + var(--gap)) 0 0;
  }
}
</style>
