<script lang="ts" setup>
import type { BlockStudiosStoryblok } from '@/types/storyblok'
import { storyblokRichTextContent } from '@/utilities/storyblok'
import { colourBackground, colourText } from '@/utilities/maps'

interface Props {
  block: BlockStudiosStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="block-studios"
    :class="[colourText[block.colour], colourBackground[block.background]]"
  >
    <div class="section wrapper grid gap-x-[var(--app-inner-gutter)] grid-cols-1 md:grid-cols-12">
      <div class="md:col-start-4 md:-col-end-1 flex flex-col gap-40">
        <StoryblokRichText
          v-if="storyblokRichTextContent(block.text)"
          :content="block.text"
          class="richtext prose-light prose-headings:max-w-[60ch] prose-headings:text-balance prose-h1:text-fluid-md prose-p:opacity-50 prose-p:text-18 prose-p:md:text-24 prose-p:max-w-[35ch]"
        />

        <ul v-if="block.studios?.length">
          <li
            v-for="studio in block.studios"
            :key="studio._uid"
            class="text-40"
          >
            {{ studio.name }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.block-studios {
  .richtext {
    & :deep(* + *) {
      margin-block-start: 1lh;
    }
  }
}
</style>
