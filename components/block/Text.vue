<script lang="ts" setup>
import { storyblokRichTextContent } from '@/utilities/storyblok'
import type { BlockTextStoryblok } from '@/types/storyblok'
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
    class="block-text relative grid gap-x-[var(--app-inner-gutter)] md:grid-cols-2 py-160 px-[var(--app-outer-gutter)]"
    :class="[colourText[block.colour], colourBackground[block.background]]"
  >
    <IconDitta class="absolute top-[var(--app-outer-gutter)] left-[var(--app-outer-gutter)] w-[100px] h-auto text-pink" />

    <h1 class="sr-only">
      ditta
    </h1>

    <StoryblokRichText
      v-if="storyblokRichTextContent(block.text)"
      class="col-span-full w-full"
      :content="block.text"
    />
  </div>
</template>

<style lang="postcss" scoped>
.block-text {
  --text-size: utopia.clamp(40, 64);
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
