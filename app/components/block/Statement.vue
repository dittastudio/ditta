<script lang="ts" setup>
import type { BlockStatement } from '#storyblok-components'

interface Props {
  block: BlockStatement
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="wrapper flex flex-col justify-center"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div
      v-if="storyblokRichTextContent(block.text)"
      class="prose text-pretty prose-p:text-title"
    >
      <StoryblokText :html="block.text" />
    </div>
  </div>
</template>
