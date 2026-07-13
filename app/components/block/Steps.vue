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
    class="relative"
  >
    <div
      ref="intro"
      class="sticky top-0 h-lvh flex items-center justify-center overflow-clip"
    >
      <h2
        ref="heading"
        class="text-super text-center whitespace-pre-wrap trim-both uppercase"
      >
        Our Process
      </h2>
    </div>

    <div
      v-for="(step, index) in block.steps"
      v-editable="step"
      :key="step._uid"
      class="sticky top-0 h-lvh flex flex-col items-center justify-center"
    >
      <div
        class="wrapper flex flex-col gap-[calc(var(--app-gutter-outer)*2)] md:gap-(--app-gutter-outer)"
        :class="{
          'max-md:items-center': true,
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
