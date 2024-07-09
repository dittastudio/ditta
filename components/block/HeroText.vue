<script lang="ts" setup>
import type { BlockHeroTextStoryblok } from '@/types/storyblok'
import { storyblokRichTextContent } from '@/utilities/storyblok'
import { colourBackground, colourText } from '@/utilities/maps'

interface Props {
  block: BlockHeroTextStoryblok
}

const { block } = defineProps<Props>()
const classes = computed(() => [colourText[block.colour], colourBackground[block.background]])
</script>

<template>
  <div
    v-editable="block"
    class="block"
    :class="classes"
  >
    <ElementLineTrail class="absolute inset-0 z-0 h-full w-full pointer-events-none" />

    <div class="section wrapper relative z-1">
      <StoryblokRichText
        v-if="storyblokRichTextContent(block.text)"
        :content="block.text"
        class="prose-p:text-fluid-md prose-dark select-none"
      />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.block {
  & :deep(p) {
    max-width: 30ch;
    text-wrap: balance;
  }

  & :deep(p + p) {
    margin-block-start: 1lh;
  }
}
</style>
