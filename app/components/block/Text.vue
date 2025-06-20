<script lang="ts" setup>
import type { BlockText } from '@@/.storyblok/types/284609/storyblok-components'

interface Props {
  block: BlockText
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="block-text wrapper max-w-[var(--breakpoint-2xl)] py-[calc(var(--app-outer-gutter)*5)] flex flex-col justify-center"
  >
    <div class="type-fluid-md max-w-[26ch]">
      <div
        v-if="storyblokRichTextContent(block.text)"
        class="type-inherit"
      >
        <StoryblokText :html="block.text" />
      </div>
    </div>
  </div>
</template>
