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
const introRef = useTemplateRef('intro')
const headingRef = useTemplateRef('heading')
const cardsRefs = useTemplateRef('card')

onMounted(async () => {
  await nextTick()

  gsap.fromTo(
    headingRef.value,
    {
      scale: 1.1,
    },
    {
      scrollTrigger: {
        trigger: introRef.value,
        start: 'top center',
        end: 'bottom center',
        scrub: 1,
      },
      scale: 1,
    },
  )

  cardsRefs.value?.forEach((el, index) => {
    const sign = index % 2 === 0 ? 1 : -1
    const rotateFrom = sign * gsap.utils.random(3, 9)
    const rotateTo = -rotateFrom

    gsap.fromTo(
      el,
      {
        scale: 1.1,
        rotate: rotateFrom,
      },
      {
        scrollTrigger: {
          trigger: el,
          start: '25% bottom',
          end: 'center center',
          scrub: 2,
        },
        ease: 'power1.out',
        scale: 1,
        rotate: rotateTo,
      },
    )
  })
})
</script>

<template>
  <div
    v-editable="block"
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
      class="sticky rounded-20 bg-[salmon] overflow-auto"
      :class="{
        'top-[calc(var(--app-vertical-rhythm)/2)]': block.spacing_top,
        'bottom-[calc(var(--app-vertical-rhythm)/2)]': block.spacing_bottom,
        'h-[calc(100vh-var(--app-vertical-rhythm))]': block.spacing_top && block.spacing_bottom,
      }"
    >
      <ul
        class="w-full bg-[green] grid grid-cols-1"
        :style="{
          height: `calc(100vh * ${block.steps?.length} - var(--app-vertical-rhythm))`,
        }"
      >
        <li
          v-for="(step, index) in block.steps"
          v-editable="step"
          :key="step._uid"
          class="w-full bg-accent"
        >
          <div
            ref="card"
            class="max-w-120 bg-[blue]"
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
              class="rounded-none! h-full!"
            />
          </div>
        </li>
      </ul>
    </div>
    <!-- <div
      ref="intro"
      class="sticky top-0 h-lvh flex items-center justify-center"
    >
      <h2
        ref="heading"
        class="text-display md:text-center whitespace-pre-wrap trim-both x-uppercase"
      >
        Our Process
      </h2>
    </div> -->

    <!-- <div
      v-for="(step, index) in block.steps"
      v-editable="step"
      :key="step._uid"
      class="sticky top-0 h-lvh flex flex-col items-center justify-center"
    >
      <div
        class="wrapper flex flex-col gap-[calc(var(--app-gutter-outer)*2)] md:gap-(--app-gutter-outer)"
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
    </div> -->
  </div>
</template>
