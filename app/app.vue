<script setup lang="ts">
import type { Settings } from '#storyblok-components'

const story = await useStory<Settings>('/settings')
const route = useRoute()

const globalClasses = computed(() => ({
  'is-storyblok-editor': storyblokEditor(route.query),
}))

useHead({
  htmlAttrs: {
    class: globalClasses,
  },
})

useSeoMeta({
  titleTemplate: (title) => (title ? `${title} - ditta` : 'ditta'),
  robots: 'index, follow',
})
</script>

<template>
  <div>
    <div class="flex items-center justify-center">
      <div class="text-xl">Ditta</div>
    </div>

    <NuxtPage />

    <pre> {{ story }} </pre>
  </div>
</template>
