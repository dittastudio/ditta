<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { BlockCta } from '#storyblok-components'

interface Props {
  block: BlockCta
}

const { block } = defineProps<Props>()
const button = computed(() => block.button?.[0])
</script>

<template>
  <div
    class="wrapper flex flex-col gap-10 md:gap-18 items-center text-center"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <p
      v-if="block.text"
      class="text-heading max-w-[24ch] text-pretty mx-auto"
    >
      {{ block.text }}
    </p>

    <StoryblokLink
      v-if="button?.link"
      :item="button.link"
    >
      <UiButton
        :text="button.text"
        :theme="button.theme as Themes"
      />
    </StoryblokLink>
  </div>
</template>
