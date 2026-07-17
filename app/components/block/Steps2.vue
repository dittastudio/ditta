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

const count = computed(() => block.steps?.length ?? 0)

let scrollTrigger: ScrollTrigger | undefined

onMounted(async () => {
  await nextTick()

  if (count.value < 2) return

  const tween = gsap.fromTo(
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

  scrollTrigger = tween.scrollTrigger
})

onUnmounted(() => {
  scrollTrigger?.kill()
  scrollTrigger = undefined
  gsap.killTweensOf(listRef.value)
})
</script>

<template>
  <div
    v-editable="block"
    ref="wrapper"
    class="wrapper bg-linear-to-b from-mood to-olive"
    :style="{
      '--inset-top': block.spacing_top ? 'calc(var(--app-vertical-rhythm) / 2)' : '0px',
      '--inset-bottom': block.spacing_bottom ? 'calc(var(--app-vertical-rhythm) / 2)' : '0px',
      paddingTop: 'var(--inset-top)',
      paddingBottom: 'var(--inset-bottom)',
      height: `calc(100lvh * ${count})`,
    }"
  >
    <div
      class="sticky rounded-20 bg-[salmon] overflow-hidden"
      :style="{
        top: 'var(--inset-top)',
        height: 'calc(100lvh - var(--inset-top) - var(--inset-bottom))',
      }"
    >
      <ul
        ref="list"
        class="w-full bg-[green] grid grid-cols-1"
        :style="{
          height: `calc((100lvh - var(--inset-top) - var(--inset-bottom)) * ${count})`,
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
