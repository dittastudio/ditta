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

let trigger: ScrollTrigger | undefined

onMounted(async () => {
  await nextTick()

  if (count.value < 2) return

  const travel = ((count.value - 1) / count.value) * 100

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrapperRef.value,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    },
  })

  tl.fromTo(listRef.value, { yPercent: 0 }, { yPercent: -travel, ease: 'none' }, 0)
  tl.fromTo(imagesRef.value, { yPercent: -travel }, { yPercent: 0, ease: 'none' }, 0)

  trigger = tl.scrollTrigger
})

onUnmounted(() => {
  trigger?.kill()
  trigger = undefined
  gsap.killTweensOf([listRef.value, imagesRef.value])
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
        class="flex w-full flex-col"
        :style="{
          height: `calc((100lvh - var(--inset-top) - var(--inset-bottom)) * ${count})`,
        }"
      >
        <li
          v-for="(step, index) in block.steps"
          v-editable="step"
          :key="step._uid"
          class="w-full flex-1"
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
        class="flex w-full flex-col-reverse"
        :style="{
          height: `calc((100lvh - var(--inset-top) - var(--inset-bottom)) * ${count})`,
        }"
      >
        <li
          v-for="(step, index) in block.steps"
          v-editable="step"
          :key="step._uid"
          class="w-full flex-1"
        >
          <NuxtImg
            v-if="step.image?.filename"
            :src="step.image.filename"
            :alt="step.image.alt ?? ''"
            :width="step.image.width ?? 0"
            :height="step.image.height ?? 0"
            class="size-full object-cover"
          />
        </li>
      </ul>
    </div>
  </div>
</template>
