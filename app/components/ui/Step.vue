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
  <div class="grid grid-cols-1 sm:grid-cols-2 items-center gap-x-(--app-gutter-inner) gap-y-10">
    <h2
      class="text-title max-w-[7em] text-balance trim-both whitespace-pre-wrap"
      v-if="title"
    >
      {{ title }}
    </h2>

    <div class="flex flex-col gap-3">
      <h3
        v-if="heading"
        class="text-subheading"
      >
        {{ heading }}
      </h3>

      <div
        v-if="storyblokRichTextContent(copy)"
        class="prose text-pretty prose-p:text-body prose-p:max-w-[30em]"
      >
        <StoryblokText :html="copy" />
      </div>
    </div>
  </div>
</template>
