<script lang="ts" setup>
import type { BlockTextStoryblok } from '@@/types/storyblok'

interface Props {
  block: BlockTextStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="block-text wrapper min-h-screen flex flex-col justify-center"
  >
    <h1
      v-if="block.title"
      class="type-fluid-md text-balance min-w-min max-w-[26ch] mx-auto"
    >
      {{ block.title }}
    </h1>

    <div
      v-if="storyblokRichTextContent(block.copy)"
      class="prose"
    >
      <StoryblokText :html="block.copy" />
    </div>
  </div>
</template>
