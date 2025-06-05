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
    y: (index: number) => index % 2 === 0 ? `${rotation * 3}%` : `-${rotation * 3}%`,
    rotate: rotation,
  }, {
    y: (index: number) => index % 2 === 0 ? `-${rotation * 3}%` : `${rotation * 3}%`,
    rotate: -rotation,
    duration: 1,
    ease: 'linear',
  }).fromTo(workInnerRef.value, {
    y: 0,
  }, {
    y: '-16%',
    duration: 1,
    ease: 'linear',
  }, '<')
})
</script>

<template>
  <div
    ref="workRef"
    class="w-full grid grid-cols-12 gap-x-[var(--app-inner-gutter)]"
  >
    <div
      :class="[
        index % 2 === 0 ? 'col-start-1 col-end-11' : 'col-start-3 col-end-13',
        colStartMap[colStart],
        colEndMap[colEnd],
      ]"
      :style="`--aspect-ratio: ${ratio}`"
    >
      <div class="relative z-1 overflow-hidden rounded-sm aspect-[var(--aspect-ratio)] size-full">
        <div
          ref="workInnerRef"
          class="absolute top-0 left-0 w-full h-[120%]"
        >
          <slot />
        </div>
      </div>

      <p class="inline-block type-fluid-xs px-3 pt-2 mt-2 -z-1 pb-2 bg-lightgrey rounded-sm backdrop-blur-sm">
        this is a caption
      </p>
    </div>
  </div>
</template>
