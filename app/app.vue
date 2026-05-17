<script setup lang="ts">
import type { Settings } from '#storyblok-components'
import { VueLenis } from 'lenis/vue'

const settings = await useStory<Settings>('/settings')
const route = useRoute()

const globalClasses = computed(() => ({
  'is-storyblok-editor': storyblokEditor(route.query),
}))

const theme = useTheme()
const straplineClass = computed(() => (theme.value.strapline === 'dark' ? 'text-white' : 'text-black'))

useHead({
  htmlAttrs: {
    class: globalClasses,
    style: computed(() => `--color-accent: var(--color-${theme.value.accent})`),
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

    <div
      v-if="settings.content.tagline"
      class="absolute top-0 left-0 z-10 pt-20 w-full"
      :class="[straplineClass]"
    >
      <p class="wrapper text-center text-16 md:text-navigation transition-colors duration-500 ease-outCubic">
        {{ settings.content.tagline }}
      </p>
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
  </VueLenis>
</template>
