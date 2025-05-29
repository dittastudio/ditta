<script lang="ts" setup>
import type { RichtextStoryblok } from '@@/types/storyblok'
import { StoryblokRichText } from '@storyblok/vue'

interface Props {
  html?: RichtextStoryblok | undefined
}

const { html } = defineProps<Props>()
</script>

<template>
  <StoryblokRichText
    v-if="html"
    :doc="html"
  />
</template>
