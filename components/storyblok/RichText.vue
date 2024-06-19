<script lang="ts" setup>
import type { RichtextStoryblok } from '@/types/storyblok'

interface Props {
  content?: RichtextStoryblok
}

const { content } = defineProps<Props>()
const html = computed(() => (content ? renderRichText(content) : ''))
</script>

<template>
  <div
    data-component="StoryblokRichText"
    v-html="html"
  />
</template>
