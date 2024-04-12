<script lang="ts" setup>
import type { ISbRichtext } from 'storyblok-js-client'

interface Props {
  content?: ISbRichtext
}

const { content } = defineProps<Props>()
const html = computed(() => (content ? renderRichText(content) : ''))
</script>

<template>
  <div data-component="StoryblokRichText" v-html="html" />
</template>
