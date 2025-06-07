<script lang="ts" setup>
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { aspectRatioMap, colEndMap, colStartMap } from '@/utils/maps'

gsap.registerPlugin(ScrollTrigger)

export interface Props {
  index?: number
  rotation?: string | number
  ratio?: App.TAspectRatios | string | number
  colStart?: string | number
  colEnd?: string | number
}

const { index = 0, rotation = '10', ratio = '3/2', colStart = '1', colEnd = '13' } = defineProps<Props>()

// Convert rotation to number for calculations
const rotationNumber = computed(() => Number(rotation))

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
    y: (index: number) => index % 2 === 0 ? `${rotationNumber.value * 3}%` : `-${rotationNumber.value * 3}%`,
    rotate: rotationNumber.value,
  }, {
    y: (index: number) => index % 2 === 0 ? `-${rotationNumber.value * 3}%` : `${rotationNumber.value * 3}%`,
    rotate: -rotationNumber.value,
    duration: 1,
    ease: 'linear',
  }).fromTo(workInnerRef.value, {
    y: 0,
  }, {
    y: '30%',
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
        colStartMap[String(colStart)],
        colEndMap[String(colEnd)],
      ]"
    >
      <div
        :class="aspectRatioMap[ratio as App.TAspectRatios]"
        class="relative z-1 overflow-hidden rounded-sm outline outline-solid outline-transparent"
      >
        <div
          ref="workInnerRef"
          class="size-full absolute top-0 left-0 flex items-end"
        >
          <div
            class="w-full h-[130%]"
          >
            <div class="w-full h-full">
              <slot name="media" />
            </div>
          </div>
        </div>
      </div>

      <p class="type-fluid-xs bg-white/70 backdrop-blur-sm inline-block px-3 py-2 mt-2 rounded-sm outline outline-solid outline-transparent hover:bg-white/100 transition-colors duration-300 ease-out">
        <slot name="caption" />
      </p>
    </div>
  </div>
</template>
