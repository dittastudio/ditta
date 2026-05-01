<script setup lang="ts">
import type { StoryblokRichtext } from '#storyblok-types'

interface Props {
  heading?: string
  copy?: StoryblokRichtext
}

const { heading, copy } = defineProps<Props>()
</script>

<template>
  <div>
    <h2
      v-if="heading"
      class="text-display max-w-[5em] mb-[0.6lh] md:mb-[0.5lh]"
    >
      {{ heading }}
    </h2>

    <div
      v-if="storyblokRichTextContent(copy)"
      class="prose text-pretty prose-p:text-lead prose-p:max-w-[21em]"
    >
      <StoryblokText :html="copy" />
    </div>
  </div>
</template>
