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
  copy: string
}

const { theme = 'offwhite' } = defineProps<Props>()

onMounted(() => {
  const proxy = { skew: 0 }
  const skewSetter = gsap.quickSetter('.block-heading__text', 'skewX', 'deg') // fast
  const clamp = gsap.utils.clamp(-20, 20)

  ScrollTrigger.create({
    onUpdate: (self) => {
      const skew = clamp(self.getVelocity() / -500)
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
  <span v-if="copy" class="block-heading block w-full border-t border-offblack relative after:absolute after:inset-x-0 after:top-full after:border-b after:border-offblack" :class="themeColorMap[theme]">
    <span class="block-heading__text block overflow-hidden type-giga p-[0.15em]">
      <span class="type-giga-trim block">
        {{ copy }}
      </span>
    </span>
  </span>
</template>
