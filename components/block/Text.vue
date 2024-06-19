<script lang="ts" setup>
import type { BlockTextStoryblok } from '@/types/storyblok'
import { storyblokRichTextContent } from '@/utilities/storyblok'
import { colourBackground, colourText } from '@/utilities/maps'

interface Props {
  block: BlockTextStoryblok
}

const { block } = defineProps<Props>()
const classes = [colourText[block.colour], colourBackground[block.background]]
</script>

<template>
  <div
    v-editable="block"
    class="block-text"
    :class="classes"
  >
    <div class="section wrapper">
      <StoryblokRichText
        v-if="storyblokRichTextContent(block.text)"
        :content="block.text"
        class="prose-p:text-fluid-md prose-dark"
      />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.block-text {
  & :deep(p) {
    max-width: 60ch;
    text-wrap: balance;
  }

  & :deep(p + p) {
    margin-block-start: 1lh;
  }
}
</style>
