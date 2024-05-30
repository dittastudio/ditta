<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const themeColorMap: any = {
  offblack: 'bg-offblack text-offwhite',
  white: 'bg-white',
  offwhite: 'bg-offwhite',
  blue: 'bg-blue text-offwhite',
  pink: 'bg-pink',
}

export interface Props {
  theme?: string
  copy: string[]
  duration?: string
  isReversed?: boolean
}

const { theme = 'offwhite', copy, isReversed = false, duration = '60s' } = defineProps<Props>()

onMounted(() => {
  const proxy = { skew: 0 }
  const skewSetter = gsap.quickSetter('.block-heading__text', 'skewX', 'deg') // fast
  const clamp = gsap.utils.clamp(-20, 20)

  ScrollTrigger.create({
    onUpdate: (self) => {
      const skew = clamp(self.getVelocity() / -300)
      // only do something if the skew is MORE severe. Remember, we're always tweening back to 0, so if the user slows their scrolling quickly, it's more natural to just let the tween handle that smoothly rather than jumping to the smaller skew.
      if (Math.abs(skew) > Math.abs(proxy.skew)) {
        proxy.skew = skew
        gsap.to(proxy, { skew: 0, duration: 0.8, ease: 'power3', overwrite: true, onUpdate: () => skewSetter(proxy.skew) })
      }
    },
  })

  gsap.set('.block-heading__text', { transformOrigin: 'right center', force3D: true })
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
  <div v-if="copy" class="block-heading block w-full border-t border-offblack relative after:absolute after:inset-x-0 after:top-full after:border-b after:border-offblack" :class="themeColorMap[theme]">
    <div class="block-heading__text marquee type-giga" :class="{ 'marquee--reverse': isReversed }">
      <div class="marquee__group">
        <p v-for="text in copy" :key="text" class="type-giga-trim block">
          {{ text }}
        </p>
      </div>

      <div aria-hidden="true" class="marquee__group">
        <p v-for="text in copy" :key="text" class="type-giga-trim block">
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
