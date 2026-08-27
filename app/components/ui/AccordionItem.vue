<script lang="ts" setup>
import type { StoryblokRichTextDoc } from '#storyblok-types'
import IconPlus from '@/assets/icons/plus.svg'

interface Props {
  heading?: string
  copy?: StoryblokRichTextDoc
}

const { heading, copy } = defineProps<Props>()
</script>

<template>
  <details class="group w-full bg-white/10">
    <summary
      v-if="heading"
      class="w-full p-6 md:p-8 select-none cursor-pointer flex items-center justify-start gap-6 md:gap-8 text-20 font-medium trim-both"
    >
      <IconPlus class="size-6 transition-transform duration-500 group-open:rotate-225" />
      {{ heading }}
    </summary>

    <div
      v-if="storyblokRichTextContent(copy)"
      class="w-full pl-18 md:pl-21.5 pr-6 md:pr-8 pb-6 md:pb-8 opacity-0 group-open:opacity-60 text-balance transition-opacity duration-500 prose"
    >
      <StoryblokText :html="copy" />
    </div>
  </details>
</template>
