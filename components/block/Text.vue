<script lang="ts" setup>
import type { BlockTextStoryblok } from '@/types/storyblok'
import { storyblokRichTextContent } from '@/utilities/storyblok'
import { colourBackground, colourText } from '@/utilities/maps'

interface Props {
  block: BlockTextStoryblok
}

const { block } = defineProps<Props>()
const classes = computed(() => ([colourText[block.colour], colourBackground[block.background]]))
</script>

<template>
  <div
    v-editable="block"
    class="block-text"
    :class="classes"
  >
    <div class="section wrapper text-center">
      <StoryblokRichText
        v-if="storyblokRichTextContent(block.text)"
        :content="block.text"
        class="
        prose-h1:text-65
        prose-h2:text-50
        prose-h3:text-40
        prose-h4:text-34
        prose-h5:text-24
        prose-h6:text-20
        prose-p:text-24
        prose-p:opacity-50
        prose-default"
      />

      <StoryblokLink
        v-if="block.link"
        :item="block.link[0].link"
        class="md:mt-40 inline-block mt-20"
      >
        <ButtonAppearance
          text-color="offwhite"
          background-color="offblack"
          size="large"
        >
          {{ block.link[0].title }}
        </ButtonAppearance>
      </StoryblokLink>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.block-text {
  & :deep(:is(h1, h2, h3, h4, h5, h6)) {
    max-width: 30ch;
    margin-inline: auto;
    text-wrap: balance;
  }

  & :deep(p) {
    max-width: 60ch;
    margin-inline: auto;
    text-wrap: balance;
  }

  & :deep(p + p) {
    margin-block-start: 1lh;
  }

  & :deep(:is(h1, h2, h3, h4, h5, h6) + p) {
    margin-block-start: 1lh;
  }
}
</style>
