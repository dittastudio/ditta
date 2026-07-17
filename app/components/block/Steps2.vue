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
const listRef = useTemplateRef('list')
const imagesRef = useTemplateRef('images')

const count = computed(() => block.steps?.length ?? 0)

let listTrigger: ScrollTrigger | undefined
let imagesTrigger: ScrollTrigger | undefined

onMounted(async () => {
  await nextTick()

  if (count.value < 2) return

  const listTween = gsap.fromTo(
    listRef.value,
    {
      yPercent: 0,
    },
    {
      scrollTrigger: {
        trigger: wrapperRef.value,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
      ease: 'none',
      yPercent: -((count.value - 1) / count.value) * 100,
    },
  )

  listTrigger = listTween.scrollTrigger

  const imagesTween = gsap.fromTo(
    imagesRef.value,
    {
      yPercent: 0,
    },
    {
      scrollTrigger: {
        trigger: wrapperRef.value,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
      ease: 'none',
      yPercent: -((count.value - 1) / count.value) * 100,
    },
  )

  imagesTrigger = imagesTween.scrollTrigger
})

onUnmounted(() => {
  ;[listTrigger, imagesTrigger].forEach((trigger) => {
    if (trigger) {
      trigger.kill()
      trigger = undefined
    }
  })

  gsap.killTweensOf(listRef.value)
})
</script>

<template>
  <div
    v-editable="block"
    ref="wrapper"
    class="wrapper"
    :style="{
      '--inset-top': block.spacing_top ? 'calc(var(--app-vertical-rhythm) / 2)' : '0px',
      '--inset-bottom': block.spacing_bottom ? 'calc(var(--app-vertical-rhythm) / 2)' : '0px',
      paddingTop: 'var(--inset-top)',
      paddingBottom: 'var(--inset-bottom)',
      height: `calc(200lvh * ${count})`,
    }"
  >
    <div
      class="sticky rounded-20 bg-[salmon] overflow-hidden grid grid-cols-2"
      :style="{
        top: 'var(--inset-top)',
        height: 'calc(100lvh - var(--inset-top) - var(--inset-bottom))',
      }"
    >
      <ul
        ref="list"
        class="w-full"
      >
        <li
          v-for="(step, index) in block.steps"
          v-editable="step"
          :key="step._uid"
          class="w-full"
          :style="{
            height: `calc((100lvh - var(--inset-top) - var(--inset-bottom))`,
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
        </li>
      </ul>

      <ul
        ref="images"
        class="w-full"
      >
        <li
          v-for="(step, index) in block.steps"
          v-editable="step"
          :key="step._uid"
          class="w-full"
          :style="{
            height: `calc((100lvh - var(--inset-top) - var(--inset-bottom))`,
          }"
        >
          IMAGE {{ index }} WILL GO HERE
        </li>
      </ul>
    </div>
  </div>
</template>
