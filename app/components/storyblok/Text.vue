<script lang="ts" setup>
import type { StoryblokRichtext } from '#storyblok-types'
import type { SbRichTextInput } from '@storyblok/richtext'
import type { SbVueRichTextComponentMap } from '@storyblok/vue'
import { StoryblokTextLink } from '#components'

interface Props {
  html?: StoryblokRichtext
}

const { html } = defineProps<Props>()

const render = useStoryblokRichText({
  components: {
    link: StoryblokTextLink,
  } as SbVueRichTextComponentMap,
})

const richText = computed(() => (html ? () => render(html as SbRichTextInput) : null))
</script>

<template>
  <component
    :is="richText"
    v-if="richText"
  />
</template>
