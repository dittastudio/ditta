<script setup lang="ts">
import type { StoryblokRichtext } from '#storyblok-types'

interface Props {
  heading?: string
  copy?: StoryblokRichtext
}

const { heading, copy } = defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-start gap-10 md:gap-20">
    <h2
      v-if="heading"
      class="text-display whitespace-pre-wrap trim-both"
    >
      {{ heading }}
    </h2>

    <div
      v-if="storyblokRichTextContent(copy)"
      class="prose text-pretty prose-p:text-lead prose-p:max-w-[21em]"
    >
      <StoryblokText :html="copy" />
    </div>

    <slot />
  </div>
</template>
