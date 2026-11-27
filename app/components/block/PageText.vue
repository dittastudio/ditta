<script lang="ts" setup>
import type { Block } from '#storyblok-schema'

interface Props {
  block: Block<'block_page_text'>
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="wrapper"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div
      v-if="storyblokRichTextContent(block.text)"
      class="mx-auto max-w-[60ch] prose prose-legal prose-links text-body text-pretty prose-headings:text-balance prose-h1:text-title prose-h1:text-center prose-h1:pt-(--app-header-height) prose-h1:pb-10 md:prose-h1:pb-16 prose-h2:text-lead prose-h3:font-semibold prose-h4:font-semibold prose-h5:font-semibold prose-h6:font-semibold"
    >
      <StoryblokText :html="block.text" />
    </div>
  </div>
</template>
