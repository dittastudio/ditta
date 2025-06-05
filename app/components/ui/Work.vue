<script lang="ts" setup>
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type AspectRatio = `${number}/${number}`

export interface Props {
  index?: number
  rotation?: number
  ratio?: AspectRatio
  colStart?: number
  colEnd?: number
}

const { index = 0, rotation = 10, ratio = '3/2', colStart = 1, colEnd = 13 } = defineProps<Props>()

const workRef = ref<HTMLElement | null>(null)
const workInnerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: workRef.value,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      markers: false,
    },
  })

  tl.fromTo(workRef.value, {
    y: (index: number) => index % 2 === 0 ? rotation * 8 : -rotation * 8,
    rotate: rotation,
  }, {
    y: (index: number) => index % 2 === 0 ? -rotation * 8 : rotation * 8,
    rotate: -rotation,
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
  <div
    ref="workRef"
    class="grid grid-cols-12 gap-x-[var(--app-inner-gutter)]"
  >
    <div
      class="relative overflow-hidden rounded-sm aspect-[var(--aspect-ratio)]"
      :class="[
        index % 2 === 0 ? 'col-start-1 col-end-11' : 'col-start-3 col-end-13',
        colStartMap[colStart],
        colEndMap[colEnd],
      ]"
      :style="`--aspect-ratio: ${ratio}`"
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
