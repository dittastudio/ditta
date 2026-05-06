<script lang="ts" setup>
import type { BlockText } from '#storyblok-components'

interface Props {
  block: BlockText
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    class="wrapper grid grid-cols-1 lg:grid-cols-2 gap-(--app-gutter-inner)"
    :class="{
      'pt-[calc(var(--app-vertical-rhythm)/2)]': block.spacing_top,
      'pb-[calc(var(--app-vertical-rhythm)/2)]': block.spacing_bottom,
    }"
  >
    <div
      v-if="storyblokRichTextContent(block.text)"
      class="col-span-1 prose prose-h2:text-subheading prose-p:text-body text-pretty max-w-[60ch]"
      :class="{
        'lg:col-start-2': block.align_right,
      }"
    >
      <StoryblokText :html="block.text" />
    </div>
  </div>
</template>
