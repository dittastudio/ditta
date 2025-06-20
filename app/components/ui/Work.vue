<script lang="ts" setup>
import type { MultilinkStoryblok } from '@@/types/storyblok'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { aspectRatioMap, colEndMap, colStartMap } from '@/utils/maps'

gsap.registerPlugin(ScrollTrigger)

export interface Props {
  link: MultilinkStoryblok
  hoverColor?: string
  index?: number
  rotation?: string | number
  ratio?: App.TAspectRatios | string | number
  colStart?: string | number
  colEnd?: string | number
}

const { link, hoverColor = 'var(--color-pink)', index = 0, rotation = '10', ratio = '3/2', colStart = '1', colEnd = '13' } = defineProps<Props>()

const rotationNumber = computed(() => Number(rotation))

const containerRef = ref<HTMLElement | null>(null)
const workRef = ref<HTMLElement | null>(null)
const workInnerRef = ref<HTMLElement | null>(null)

let scrollTriggerInstance: ScrollTrigger | null = null
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
let isRefreshing = false

onMounted(() => {
  const movementTl = gsap.timeline({
    scrollTrigger: {
      trigger: workRef.value,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      markers: false,
    },
  })

  let currentState = false
  const setHoverColor = (isActive: boolean) => {
    if (currentState !== isActive) {
      currentState = isActive
      if (isActive) {
        document.documentElement.style.setProperty('--dynamic-hover-color', hoverColor)
        document.body.classList.add('has-hover-color')
      }
      else {
        document.body.classList.remove('has-hover-color')
      }
    }
  }

  scrollTriggerInstance = ScrollTrigger.create({
    trigger: containerRef.value,
    start: 'top center',
    end: 'bottom center',
    onEnter: () => setHoverColor(true),
    onLeave: () => setHoverColor(false),
    onEnterBack: () => setHoverColor(true),
    onLeaveBack: () => setHoverColor(false),
    markers: false,
  })

  // Highly performant debounced resize handler
  const handleResize = () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing)
      return

    // Clear existing timeout
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }

    // Set new timeout for debounced refresh
    resizeTimeout = setTimeout(() => {
      isRefreshing = true

      // Refresh all ScrollTriggers at once (much more efficient)
      ScrollTrigger.refresh()

      isRefreshing = false
    }, 200) // Slightly longer debounce for better performance
  }

  window.addEventListener('resize', handleResize, { passive: true })

  movementTl.fromTo(workRef.value, {
    rotate: rotationNumber.value,
  }, {
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

  // Cleanup
  onUnmounted(() => {
    document.body.classList.remove('has-hover-color')
    window.removeEventListener('resize', handleResize)
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill()
      scrollTriggerInstance = null
    }
  })
})
</script>

<template>
  <div
    ref="containerRef"
    class="w-full"
  >
    <div
      ref="workRef"
      class="w-full grid grid-cols-12 gap-x-[var(--app-inner-gutter)] py-[calc(var(--app-outer-gutter)*2)]"
    >
      <StoryblokLink
        :item="link"
        class="block text-center"
        :class="[
          index % 2 ? 'col-start-3 col-end-13' : 'col-start-1 col-end-11',
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

        <slot name="caption" />
      </StoryblokLink>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
:global(body) {
  background-color: transparent;
  transition: background-color 1s var(--ease-out);
}

:global(body.has-hover-color) {
  background-color: var(--dynamic-hover-color);
}
</style>
