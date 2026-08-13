<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { BlockSteps } from '#storyblok-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  block: BlockSteps
}

const { block } = defineProps<Props>()
// const containerRef = useTemplateRef('container')
// const introRef = useTemplateRef('intro')
// const headingRef = useTemplateRef('heading')
const cardsRefs = useTemplateRef('card')

const rotation = ref(0)

const onMouseMove = (event: MouseEvent) => {
  rotation.value = (event.clientX / window.innerWidth) * 80 - 40
}

onMounted(async () => {
  await nextTick()

  window.addEventListener('mousemove', onMouseMove, { passive: true })

  // gsap.fromTo(
  //   headingRef.value,
  //   {
  //     scale: 1.2,
  //   },
  //   {
  //     scrollTrigger: {
  //       trigger: introRef.value,
  //       start: 'center center',
  //       end: 'bottom top',
  //       scrub: true,
  //       markers: true,
  //     },
  //     scale: 1,
  //     ease: 'power2.inOut',
  //   },
  // )

  cardsRefs.value?.forEach((el, index) => {
    const sign = index % 2 === 0 ? 1 : -1
    const rotateFrom = sign * gsap.utils.random(3, 9)
    const rotateTo = -rotateFrom

    gsap.fromTo(
      el,
      {
        scale: 1.2,
        rotate: rotateFrom,
      },
      {
        scrollTrigger: {
          trigger: el.parentElement?.parentElement,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
          markers: false,
        },
        ease: 'power1.in',
        scale: 1,
        rotate: rotateTo,
      },
    )
  })
})

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <div
    v-editable="block"
    class="wrapper flex flex-col gap-(--app-gutter-outer) overflow-clip"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div class="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-5">
      <UiLockup
        class="col-span-full md:col-span-8"
        :heading="block.heading"
        :copy="block.copy"
      />

      <div class="col-span-full md:col-span-4">
        <IconPixelArrow
          class="animate-bob w-30 md:w-40 mx-auto"
          :style="{ transform: `rotate(${rotation}deg)` }"
        />
      </div>
    </div>

    <div
      v-for="(step, index) in block.steps"
      v-editable="step"
      :key="step._uid"
      class="sticky top-0 h-svh flex flex-col items-center justify-center max-md:px-(--app-gutter-outer)"
    >
      <div
        class="w-full flex flex-col gap-[calc(var(--app-gutter-outer)*2)] md:gap-(--app-gutter-outer)"
        :class="{
          'items-center': true,
          'md:items-start': index === 0,
          'md:items-center': index === 1 || index > 2,
          'md:items-end': index === 2,
        }"
      >
        <div
          ref="card"
          class="max-w-120"
          :style="{
            paddingTop: `calc(var(--app-gutter-outer) * ${index})`,
          }"
        >
          <CardStep
            :number="`0${index + 1}`.slice(-2)"
            :title="step.title"
            :heading="step.heading"
            :copy="step.copy"
            :theme="'theme' in step ? (step.theme as Themes) : undefined"
          />
        </div>
      </div>
    </div>
  </div>
</template>
