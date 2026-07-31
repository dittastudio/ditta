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
const containerRef = useTemplateRef('container')
const introRef = useTemplateRef('intro')
const headingRef = useTemplateRef('heading')
const cardsRefs = useTemplateRef('card')

onMounted(async () => {
  await nextTick()

  gsap.fromTo(
    headingRef.value,
    {
      scale: 1.2,
    },
    {
      scrollTrigger: {
        trigger: introRef.value,
        start: 'center center',
        end: 'bottom top',
        scrub: true,
        markers: true,
      },
      scale: 1,
      ease: 'power2.inOut',
    },
  )

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
</script>

<template>
  <div
    v-editable="block"
    class="relative contain-layout"
    ref="container"
  >
    <div
      ref="intro"
      class="sticky top-0 h-svh text-center flex items-center justify-center px-[calc(var(--app-gutter-outer)*2)]"
    >
      <h2
        ref="heading"
        class="text-display md:text-center trim-both"
      >
        Our Process
      </h2>
      <!-- <div
        ref="heading"
        class="w-full"
      >
        <UiTicker
          :trigger-el="containerRef"
          spacing-classes="gap-10 px-5"
        >
          <template
            v-for="i in 4"
            :key="i"
          >
            <div class="text-super trim-both">OUR PROCESS</div>

            <div
              aria-hidden="true"
              class="text-super trim-both"
            >
              &mdash;
            </div>
          </template>
        </UiTicker>
      </div> -->
    </div>

    <div
      v-for="(step, index) in block.steps"
      v-editable="step"
      :key="step._uid"
      class="sticky top-0 h-svh flex flex-col items-center justify-center"
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
    </div>
  </div>
</template>
