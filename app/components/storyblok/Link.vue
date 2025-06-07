<script lang="ts" setup>
import type { MultilinkStoryblok } from '@@/types/storyblok'

interface Props {
  item: MultilinkStoryblok
}

const { item } = defineProps<Props>()

const href
  = item?.linktype === 'email'
    ? `mailto:${item?.email}`
    : item?.linktype === 'story'
      ? `/${item?.cached_url?.replace('home', '')}`
      : item?.cached_url

const customAttributes = {
  class: item?.class,
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
  <NuxtLink v-bind="attributes">
    <slot />
  </NuxtLink>
</template>
