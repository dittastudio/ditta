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
    class="post-text wrapper max-w-295"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div
      v-if="storyblokRichTextContent(block.text)"
      :class="{
        'px-7 py-6 -mx-7 border border-beige bg-accent/20 rounded-20 squircle-40': block.isSummary,
      }"
      class="prose prose-post prose-links prose-bold:text-body prose-bold:font-bold prose-headings:text-mono-title prose-headings:mt-20 prose-headings:font-bold prose-headings:text-balance prose-p:text-mono-body prose-p:text-pretty max-w-[80ch]"
    >
      <StoryblokText :html="block.text" />
    </div>
  </div>
</template>

<style lang="postcss">
.section--block_post_text:has(+ .section--block_post_text) .post-text {
  padding-bottom: 50px;
}
</style>
