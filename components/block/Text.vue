<script lang="ts" setup>
import type { BlockTextStoryblok } from '@/types/storyblok'
import { storyblokRichTextContent } from '@/utilities/storyblok'
import { colourBackground, colourText } from '@/utilities/maps'
import IconDitta from '@/assets/icons/ditta.svg'

interface Props {
  block: BlockTextStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="block-text"
    :class="[colourText[block.colour], colourBackground[block.background]]"
  >
    <div class="section wrapper">
      <StoryblokRichText
        v-if="storyblokRichTextContent(block.text)"
        :content="block.text"
      />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.block-text {
  --text-size: utopia.clamp(40, 65);
  --line-height: theme('lineHeight.snug');

  & :deep(p) {
    max-width: 60ch;

    font-size:  var(--text-size);
    line-height: var(--line-height);
    text-wrap: balance;
    letter-spacing: theme('letterSpacing.tight');
  }

  & :deep(p + p) {
    margin-block-start: 1lh;
  }
}
</style>
