<script lang="ts" setup>
import type { StoryblokMultilink } from '@@/.storyblok/types/storyblok'

interface Props {
  item: StoryblokMultilink
}

const { item } = defineProps<Props>()

const href
  = item?.linktype === 'email'
    ? `mailto:${item?.email}`
    : item?.linktype === 'story'
      ? `/${item?.cached_url?.replace('home', '')}`
      : item?.cached_url

const customAttributes = {
  title: item?.title,
  rel: item?.rel,
}

const attributes = {
  ...customAttributes,
  to: href?.trim().replace(/\/+$/, ''),
  target: item?.target ?? item?.linktype === 'asset' ? '_blank' : null,
}
</script>

<template>
  <NuxtLink
    v-if="href"
    v-bind="attributes"
  >
    <slot />
  </NuxtLink>

  <div
    v-else
    v-bind="attributes"
  >
    <slot />
  </div>
</template>
