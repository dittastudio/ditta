<script setup lang="ts">
import type { Settings } from '#storyblok-components'
import IconLogo from '@/assets/icons/ditta.svg'

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

      <IconLogo class="ml-2 h-6 w-auto" />
    </div>

    <NuxtPage />

    <pre> {{ story }} </pre>
  </div>
</template>
