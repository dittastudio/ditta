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
  description:
    'ditta is a new digital agency in London. We are a team of designers, developers and strategists who are passionate about creating digital products that people love to use.',
})
</script>

<template>
  <div data-component="App">
    <LayoutApp>
      <template #header>
        <!-- <AppHeader /> -->
      </template>

      <template #main>
        <NuxtPage />
      </template>

      <template #footer>

      </template>
    </LayoutApp>
  </div>
</template>