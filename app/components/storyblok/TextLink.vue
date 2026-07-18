<script lang="ts" setup>
import type { SbVueRichTextProps } from '@storyblok/vue'
import { NuxtLink } from '#components'

defineOptions({ inheritAttrs: false })

const { attrs } = defineProps<SbVueRichTextProps['link']>()

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
