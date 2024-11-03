<script lang="ts" setup>
import type { RichtextStoryblok } from '@/types/storyblok'

interface Props {
  content?: RichtextStoryblok
}

const { content } = defineProps<Props>()
const html = computed(() => (content ? renderRichText(content) : ''))
</script>

<template>
  <div v-html="html" />
</template>
