<script lang="ts" setup>
import type { StoryblokVueRichTextProps, StoryblokVueRichTextRenderContext } from '@storyblok/vue'

interface Props {
  type: 'link'
  attrs: StoryblokVueRichTextProps['link']['attrs']
  // eslint-disable-next-line vue/prop-name-casing
  _key?: string
  context?: StoryblokVueRichTextRenderContext
}

defineOptions({ inheritAttrs: false })

const { attrs } = defineProps<Props>()

const to = computed(() => {
  const { href, linktype } = attrs ?? {}

  if (linktype === 'email') {
    return `mailto:${href}`
  }

  if (linktype === 'story') {
    return storyblokSlug(href ?? '')
  }

  return href ?? undefined
})
</script>

<template>
  <NuxtLink
    :to="to"
    :target="attrs?.target || undefined"
  >
    <slot />
  </NuxtLink>
</template>
