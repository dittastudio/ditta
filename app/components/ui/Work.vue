<script lang="ts" setup>
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const workRef = ref<HTMLElement | null>(null)
const workInnerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: workRef.value,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      markers: true,
    },
  })

  tl.fromTo(workRef.value, {
    rotate: 10,
  }, {
    rotate: -10,
    duration: 1,
    ease: 'linear',
  }).fromTo(workInnerRef.value, {
    y: 0,
  }, {
    y: '-20%',
    duration: 1,
    ease: 'linear',
  }, '<')
})
</script>

<template>
  <div ref="workRef">
    <div
      class="relative aspect-[3/2] overflow-hidden"
    >
      <div
        ref="workInnerRef"
        class="absolute top-0 left-0 w-full h-[120%]"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
