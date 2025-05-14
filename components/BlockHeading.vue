<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export interface Props {
  copy: any[]
  duration?: string
  direction?: 'left' | 'right'
  isLast?: boolean
}

const { copy, direction = 'left', duration = '60s', isLast = false } = defineProps<Props>()

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

const multipleWords: any = [...copy, ...copy, ...copy, ...copy, ...copy, ...copy, ...copy, ...copy, ...copy]
</script>

<template>
  <div
    v-if="copy"
    class="block-heading w-full transform-gpu backface-hidden contain-paint"
    :class="{ 'block-heading--last': isLast }"
  >
    <div
      ref="container"
      class="block-heading__wrapper"
    >
      <div
        class="block-heading__marquee type-fluid-lg lowercase"
        :class="{ [`block-heading__marquee--${direction}`]: direction }"
      >
        <div class="block-heading__group">
          <p
            v-for="(word, index) in multipleWords"
            :key="word"
            :aria-hidden="index > 0 ? true : undefined"
            class="block-heading__copy block"
          >
            {{ word }}
          </p>
        </div>

        <div
          aria-hidden="true"
          class="block-heading__group"
        >
          <p
            v-for="word in multipleWords"
            :key="word"
            class="block-heading__copy block"
          >
            {{ word }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.block-heading {
  position: relative;

  &::before,
  &::after {
    position: absolute;
    right: 0;
    left: 0;

    width: calc(100% - (var(--app-outer-gutter) * 2));
    height: 1px;
    margin-inline: auto;

    opacity: 0.2;
    background-color: currentColor;
  }

  &::before {
    content: '';
    top: 0;
  }

  &--last {
    &::after {
      content: '';
      bottom: 0;
    }
  }
}

.block-heading__marquee {
  --duration: v-bind(duration);
  --gap: 0.3em;

  user-select: none;

  display: flex;
  gap: var(--gap);

  min-width: 100%;
  padding: 0.2em 0.15em;

  &--left {
    animation: auto linear scroll-left both;
    animation-timeline: view();

    animation-range: entry 0% cover 100%;
  }

  &--right {
    justify-content: flex-end;
    animation: auto linear scroll-right both;
    animation-timeline: view();

    animation-range: entry 0% cover 100%;
  }
}

.block-heading__group {
  will-change: translate;

  display: flex;
  flex-shrink: 0;
  gap: var(--gap);
  align-items: center;
  justify-content: space-around;

  min-width: 100%;

  .block-heading__marquee--left & {
    animation: ticker-left var(--duration) linear infinite;
  }

  .block-heading__marquee--right & {
    animation: ticker-right var(--duration) linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
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

.block-heading__copy {
  margin-block: -0.147em -0.013em;
  line-height: 1.1;
}
</style>
