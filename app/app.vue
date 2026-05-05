<script setup lang="ts">
import type { Settings } from '#storyblok-components'

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
  <div>
    <div class="wrapper absolute top-0 z-10 flex justify-between items-start pt-(--app-gutter-outer) md:pt-20">
      <p
        v-if="settings.content.tagline"
        class="text-navigation"
      >
        {{ settings.content.tagline }}
      </p>

      <AppNavigation
        v-if="settings.content.navigation"
        :items="settings.content.navigation"
      />
    </div>

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
  </div>
</template>
