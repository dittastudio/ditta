<script lang="ts" setup>
import type { BlockPostText } from '#storyblok-components'

interface Props {
  block: BlockPostText
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="wrapper max-w-295 min-h-svh"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div
      v-if="storyblokRichTextContent(block.text)"
      class="prose prose-headings:text-mono-title prose-headings:text-balance prose-p:text-mono-body prose-p:text-pretty max-w-[80ch]"
    >
      <StoryblokText :html="block.text" />
    </div>
  </div>
</template>
