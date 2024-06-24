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
        class="prose-p:text-16 prose-p:md:text-18 prose-headings:text-24 prose-headings:md:text-40 prose-default"
      />

      <StoryblokLink
        v-if="block.link"
        :item="block.link[0].link"
        class="mt-20"
      >
        <ButtonAppearance
          text-color="offwhite"
          background-color="offblack"
        >
          {{ block.link[0].title }}
        </ButtonAppearance>
      </StoryblokLink>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.block-text {
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
