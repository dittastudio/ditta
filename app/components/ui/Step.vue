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
      class="text-title max-w-[7em] text-balance"
      v-if="title"
    >
      <span class="block mt-[-0.24em] mb-[-0.17em]">
        {{ title }}
      </span>
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
        class="prose text-pretty prose-p:text-body prose-p:max-w-[30em]"
      >
        <StoryblokText :html="copy" />
      </div>
    </div>
  </div>
</template>
