<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { BlockSteps } from '#storyblok-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  block: BlockSteps
}

const { block } = defineProps<Props>()
const wrapperRef = useTemplateRef('wrapper')
const containerRef = useTemplateRef('container')

onMounted(async () => {
  await nextTick()

  ScrollTrigger.create({
    trigger: wrapperRef.value,
    start: 'top top',
    end: 'bottom bottom',
    markers: true,
  })

  // cardsRefs.value?.forEach((el, index) => {
  //   const sign = index % 2 === 0 ? 1 : -1
  //   const rotateFrom = sign * gsap.utils.random(3, 9)
  //   const rotateTo = -rotateFrom

  //   gsap.fromTo(
  //     el,
  //     {
  //       scale: 1.1,
  //       rotate: rotateFrom,
  //     },
  //     {
  //       scrollTrigger: {
  //         trigger: el,
  //         start: '25% bottom',
  //         end: 'center center',
  //         scrub: 2,
  //       },
  //       ease: 'power1.out',
  //       scale: 1,
  //       rotate: rotateTo,
  //     },
  //   )
  // })
})
</script>

<template>
  <div
    v-editable="block"
    ref="wrapper"
    class="wrapper bg-linear-to-b from-mood to-olive"
    :class="{
      'pt-[calc(var(--app-vertical-rhythm)/2)]': block.spacing_top,
      'pb-[calc(var(--app-vertical-rhythm)/2)]': block.spacing_bottom,
    }"
    :style="{
      height: `calc(100vh * ${block.steps?.length})`,
    }"
  >
    <div
      ref="container"
      class="sticky rounded-20 bg-[salmon] overflow-hidden"
      :class="{
        'top-[calc(var(--app-vertical-rhythm)/2)]': block.spacing_top,
        'bottom-[calc(var(--app-vertical-rhythm)/2)]': block.spacing_bottom,
        'h-[calc(100vh-var(--app-vertical-rhythm))]': block.spacing_top && block.spacing_bottom,
      }"
    >
      <ul
        class="w-full bg-[green] grid grid-cols-1"
        :style="{
          height: `calc((100vh - var(--app-vertical-rhythm)) * ${block.steps?.length})`,
        }"
      >
        <li
          v-for="(step, index) in block.steps"
          v-editable="step"
          :key="step._uid"
          class="w-full"
        >
          <CardStep
            :number="`0${index + 1}`.slice(-2)"
            :title="step.title"
            :heading="step.heading"
            :copy="step.copy"
            :theme="'theme' in step ? (step.theme as Themes) : undefined"
            class="rounded-none! h-full!"
          />
        </li>
      </ul>
    </div>
  </div>
</template>
