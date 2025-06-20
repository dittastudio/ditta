<script lang="ts" setup>
import type { StoryblokRichtext } from '@@/.storyblok/types/storyblok'
import { StoryblokRichText } from '@storyblok/vue'

interface Props {
  html?: StoryblokRichtext | undefined
}

const { html } = defineProps<Props>()
</script>

<template>
  <StoryblokRichText
    v-if="html"
    :doc="html"
  />
</template>
