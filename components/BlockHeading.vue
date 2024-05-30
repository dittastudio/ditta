<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const backgroundColorMap: any = {
  black: 'bg-black',
  offblack: 'bg-offblack',
  white: 'bg-white',
  offwhite: 'bg-offwhite',
  grey: 'bg-grey',
  blue: 'bg-blue',
  pink: 'bg-pink',
  orange: 'bg-orange',
  red: 'bg-red',
  green: 'bg-green',
}

const textColorMap: any = {
  black: 'text-black',
  offblack: 'text-offblack',
  white: 'text-white',
  offwhite: 'text-offwhite',
  grey: 'text-grey',
  blue: 'text-blue',
  pink: 'text-pink',
  orange: 'text-orange',
  red: 'text-red',
  green: 'text-green',
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
      const skew = clamp(self.getVelocity() / -300)

      if (Math.abs(skew) > Math.abs(proxy.skew)) {
        proxy.skew = skew
        gsap.to(proxy, { skew: 0, duration: 1, ease: 'power3', overwrite: true, onUpdate: () => skewSetter(proxy.skew) })
      }
    },
  })

  gsap.set(container.value, { transformOrigin: 'right center', force3D: true })
})

// const main = ref()
// let ctx: any

// onMounted(() => {
//   ctx = gsap.context((self) => {
//     const text = self.selector('.block-heading__text')

//     gsap.to(text, {
//       x: 150,
//       scrollTrigger: {
//         trigger: text,
//         start: 'top bottom',
//         end: 'top 20%',
//         scrub: 1,
//       },
//     })
//   }, main.value) // <- Scope!
// })

// onUnmounted(() => {
//   ctx.revert() // <- Easy Cleanup!
// })
</script>

<template>
  <div
    v-if="copy"
    class="block-heading block w-full border-t border-offblack relative after:absolute after:inset-x-0 after:top-full after:border-b after:border-offblack"
    :class="[backgroundColorMap[backgroundColor], textColorMap[textColor]]"
  >
    <div ref="container" class="marquee type-giga" :class="{ 'marquee--reverse': isReversed }">
      <div class="marquee__group">
        <p v-for="text in [...copy, ...copy, ...copy]" :key="text" class="type-giga-trim block">
          {{ text }}
        </p>
      </div>

      <div aria-hidden="true" class="marquee__group">
        <p v-for="text in [...copy, ...copy, ...copy]" :key="text" class="type-giga-trim block">
          {{ text }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marquee {
  --duration: v-bind(duration);
  --gap: 1em;

  user-select: none;

  overflow: hidden;
  display: flex;
  gap: var(--gap);

  padding: 0.15em;
}

.marquee__group {
  display: flex;
  flex-shrink: 0;
  gap: var(--gap);
  align-items: center;
  justify-content: space-around;

  min-width: 100%;

  animation: scroll var(--duration) linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .marquee__group {
    animation-play-state: paused;
  }
}

.marquee--reverse .marquee__group {
  animation-delay: calc(var(--duration) / -2);
  animation-direction: reverse;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(calc(-100% - var(--gap)));
  }
}
</style>
