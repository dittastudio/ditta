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

const { onLoaded } = useAnalytics()

onLoaded(() => {
  console.log('Analytics loaded', window.plausible)
  window.plausible = window.plausible || function () {
    (window.plausible.q = window.plausible.q || []).push(arguments)
  }
})
</script>

<template>
  <div data-component="App">
    <NuxtPage />

    <AppFooter />
  </div>
</template>
