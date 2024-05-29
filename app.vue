<script lang="ts" setup>
import { isStoryblokEditor } from '@/utilities/helpers'
import IconDitta from '@/assets/icons/ditta.svg'

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
</script>

<template>
  <div data-component="App">
    <NuxtPage />

    <AppFooter />
  </div>
</template>
