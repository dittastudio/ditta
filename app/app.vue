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
    }"
  >
    <Transition
      name="fade"
      mode="out-in"
    >
      <AppTagline
        v-if="settings.content.tagline && !route.path.startsWith('/blog')"
        :text="settings.content.tagline"
        :as="route.path === '/' ? 'h1' : 'p'"
        class="absolute top-0 left-0 z-2 pt-25"
      />
    </Transition>

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
