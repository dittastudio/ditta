<script lang="ts" setup>
import { isStoryblokEditor } from '@/utilities/helpers'

const route = useRoute()

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

useScriptPlausibleAnalytics({
  domain: 'ditta.studio',
  extension: ['file-downloads', 'outbound-links'],
})
</script>

<template>
  <div data-component="App">
    <AppHeader />

    <NuxtPage />

    <AppFooter />
  </div>
</template>
