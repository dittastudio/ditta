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
      <div class="w-full md:col-start-4 md:-col-end-1 flex flex-col gap-[2lh]">
        <StoryblokRichText
          v-if="storyblokRichTextContent(block.text)"
          :content="block.text"
          class="richtext"
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
    & :deep(:is(h1, h2, h3, h4, h5, h6)) {
      max-width: 60ch;
      text-wrap: balance;
    }

    & :deep(h1) {
      @apply text-65;
    }

    & :deep(h2) {
      @apply text-40;
    }

    & :deep(h3) {
      @apply text-24;
    }

    & :deep(h4) {
      @apply text-20;
    }

    & :deep(h5) {
      @apply text-18;
    }

    & :deep(h6) {
      @apply text-16;
    }

    & :deep(:is(p, li)) {
      @apply text-24 opacity-50;
    }

    & :deep(* + *) {
      margin-block-start: 1lh;
    }
  }
}
</style>
