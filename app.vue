<script lang="ts" setup>
import { isStoryblokEditor } from '@/utilities/helpers'

const route = useRoute()
const isDev = import.meta.dev

const globalClasses = computed(() => ({
  'is-storyblok-editor': isStoryblokEditor(route.query),
}))

useHead({
  htmlAttrs: {
    class: globalClasses,
  },
})

useSeoMeta({
  titleTemplate: title => (title ? `${title} - ditta` : 'ditta'),
  robots: 'index, follow',
})
</script>

<template>
  <div data-component="App">
    <main>
      <NuxtPage />
    </main>

    <AppFooter />

    <ToolGrid v-if="isDev" />
  </div>
</template>
