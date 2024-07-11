<script lang="ts" setup>
import { storyblokEditor } from '@/utilities/storyblok'

const route = useRoute()
const isDev = import.meta.dev

const globalClasses = computed(() => ({
  'is-storyblok-editor': storyblokEditor(route.query),
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
  <div>
    <main>
      <NuxtPage />
    </main>

    <AppFooter />

    <ToolGrid v-if="isDev" />
  </div>
</template>
