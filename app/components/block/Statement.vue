<script lang="ts" setup>
import type { BlockStatement } from '#storyblok-components'

interface Props {
  block: BlockStatement
}

const { block } = defineProps<Props>()
</script>

<template>
  <div class="wrapper flex flex-col justify-center min-h-screen py-(--app-vertical-rhythm)">
    <div
      v-if="storyblokRichTextContent(block.text)"
      class="prose text-pretty prose-p:text-title"
    >
      <StoryblokText :html="block.text" />
    </div>
  </div>
</template>
