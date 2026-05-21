<script setup lang="ts">
import type { Settings } from '#storyblok-components'
import { VueLenis } from 'lenis/vue'

const settings = await useStory<Settings>('/settings')

const route = useRoute()
const router = useRouter()

const globalClasses = computed(() => ({
  'is-storyblok-editor': storyblokEditor(route.query),
}))

const appStore = useAppStore()
const taglineClass = computed(() => (appStore.getTheme === 'dark' ? 'text-white' : 'text-black'))

useHead({
  htmlAttrs: {
    class: globalClasses,
    style: computed(() => `--color-accent: var(--color-${appStore.getAccent})`),
  },
})

useSeoMeta({
  titleTemplate: (title) => (title ? `${title} - ditta` : 'ditta'),
  robots: 'index, follow',
})

const dock = useTemplateRef('dock')

router.afterEach(() => {
  dock.value?.close()
})
</script>

<template>
  <VueLenis
    root
    :options="{
      duration: 0.75,
      autoRaf: true,
      anchors: {
        duration: 1.5,
        offset: 1,
      },
    }"
  >
    <div
      v-if="settings.content.tagline"
      class="absolute top-0 left-0 z-10 pt-20 w-full"
      :class="[taglineClass]"
    >
      <p class="wrapper text-center text-16 md:text-navigation transition-colors duration-500 ease-outCubic">
        {{ settings.content.tagline }}
      </p>
    </div>

    <AppDock
      ref="dock"
      :items="settings.content.navigation"
    />

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
