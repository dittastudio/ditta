<script setup lang="ts">
import type { Settings } from '#storyblok-components'
import { VueLenis } from 'lenis/vue'

const settings = await useStory<Settings>('/settings')
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
  <VueLenis
    root
    :options="{
      duration: 0.75,
      autoRaf: true,
      anchors: {
        duration: 1,
        offset: 1,
      },
    }"
  >
    <AppDock
      :tagline="settings.content.tagline"
      :items="settings.content.navigation"
    />

    <!--
    <AppHeader :tagline="settings.content.tagline">
      <AppNavigation
        v-if="settings.content.navigation"
        :items="settings.content.navigation"
      />
    </AppHeader>
    -->

    <NuxtPage />

    <AppFooter :text="settings.content.footer_copy_v2" />

    <DevOnly>
      <DevGuide
        :columns="{ base: 2, md: 12 }"
        inner-gutter="var(--app-gutter-inner)"
        outer-gutter="var(--app-gutter-outer)"
        max-width="var(--breakpoint-2xl)"
      />
    </DevOnly>
  </VueLenis>
</template>
