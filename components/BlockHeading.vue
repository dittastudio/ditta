<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const backgroundColorMap: any = {
  'black': 'bg-black',
  'offblack': 'bg-offblack',
  'white': 'bg-white',
  'offwhite': 'bg-offwhite',
  'grey': 'bg-grey',
  'blue': 'bg-blue',
  'blue-light': 'bg-blue-light',
  'pink': 'bg-pink',
  'orange': 'bg-orange',
  'yellow': 'bg-yellow',
  'red': 'bg-red',
  'green': 'bg-green',
}

const textColorMap: any = {
  'black': 'text-black',
  'offblack': 'text-offblack',
  'white': 'text-white',
  'offwhite': 'text-offwhite',
  'grey': 'text-grey',
  'blue': 'text-blue',
  'blue-light': 'text-blue-light',
  'pink': 'text-pink',
  'orange': 'text-orange',
  'yellow': 'text-yellow',
  'red': 'text-red',
  'green': 'text-green',
}

export interface Props {
  backgroundColor?: string
  textColor?: string
  copy: string[]
  duration?: string
  isReversed?: boolean
}

const { backgroundColor = 'offwhite', textColor = 'offblack', copy, isReversed = false, duration = '60s' } = defineProps<Props>()

const container = ref()

onMounted(() => {
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
})

const multipleWords = [...copy, ...copy, ...copy]
</script>

<template>
  <div
    v-if="copy"
    class="transform-gpu backface-hidden contain-paint block w-full border-t border-offblack relative after:absolute after:inset-x-0 after:top-full after:border-b after:border-offblack"
    :class="[backgroundColorMap[backgroundColor], textColorMap[textColor]]"
  >
    <div ref="container">
      <div class="marquee type-giga" :class="{ 'marquee--is-reversed': isReversed }">
        <div class="marquee__group">
          <p
            v-for="(word, index) in multipleWords"
            :key="word"
            :aria-hidden="index > 0 ? true : null"
            class="type-giga-trim block"
          >
            {{ word }}
          </p>
        </div>

        <div aria-hidden="true" class="marquee__group">
          <p v-for="word in multipleWords" :key="word" class="type-giga-trim block">
            {{ word }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.marquee {
  --duration: v-bind(duration);
  --gap: 1em;

  user-select: none;

  display: flex;
  gap: var(--gap);

  min-width: 100%;
  padding: 0.15em;

  &:not(&--is-reversed) {
    animation: auto linear scroll-left both;
    animation-timeline: view();

    animation-range: entry 0% cover 100%;
  }

  &--is-reversed {
    justify-content: flex-end;
    animation: auto linear scroll-right both;
    animation-timeline: view();

    animation-range: entry 0% cover 100%;
  }
}

.marquee__group {
  will-change: translate;

  display: flex;
  flex-shrink: 0;
  gap: var(--gap);
  align-items: center;
  justify-content: space-around;

  min-width: 100%;

  .marquee:not(.marquee--is-reversed) & {
    animation: ticker-left var(--duration) linear infinite;
  }

  .marquee--is-reversed & {
    animation: ticker-right var(--duration) linear infinite;
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee__group {
    animation-play-state: paused;
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
