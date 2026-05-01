<script setup lang="ts">
import type { StoryblokRichtext } from '#storyblok-types'

interface Props {
  title?: string
  heading?: string
  copy?: StoryblokRichtext
}

const { title, heading, copy } = defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-2 items-center gap-(--app-gutter-inner)">
    <h2
      class="text-title"
      v-if="title"
    >
      {{ title }}
    </h2>

    <div>
      <h3
        v-if="heading"
        class="text-subheading mb-[0.675em]"
      >
        {{ heading }}
      </h3>

      <div
        v-if="storyblokRichTextContent(copy)"
        class="prose text-pretty prose-p:text-body prose-p:max-w-[21em]"
      >
        <StoryblokText :html="copy" />
      </div>
    </div>
  </div>
</template>
