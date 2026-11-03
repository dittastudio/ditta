<script setup lang="ts">
import type { Block } from '#storyblok-schema'
import type { Themes } from '@/types/app'
import { VueLenis } from 'lenis/vue'

const settings = await useStory<Block<'settings'>>('/settings')

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// Vue renders the Dock and Tagline before the page's async setup resolves, so the page can't set this in time
if (import.meta.server) {
  const page = await useStory<Block<'page'> | Block<'project'>>(
    route.path,
    { resolve_relations: storyRelations },
    { resolveRelations: storyRelations },
  )
  const first = page.value.content.blocks?.[0]

  if (first && 'theme' in first) appStore.setTheme(first.theme as Themes)
  else if (isPost(page.value)) appStore.setTheme('light')
}

const globalClasses = computed(() => ({
  'is-storyblok-editor': storyblokEditor(route.query),
}))

// Prerendered HTML can't read the cookie, so apply the saved accent before first paint
const accentScript = `try {
  const accent = JSON.parse(decodeURIComponent(document.cookie.match(/(?:^|; )app=([^;]*)/)?.[1] ?? '{}')).accent
  if (['pink', 'mood', 'olive'].includes(accent)) {
    document.documentElement.style.setProperty('--color-accent', 'var(--color-' + accent + ')')
  }
} catch {}`

useHead({
  htmlAttrs: {
    class: globalClasses,
    style: computed(
      () => `--color-accent: var(--color-${appStore.getAccent}); --dock-height: ${appStore.getDockHeight}px`,
    ),
  },
  script: [{ key: 'accent', innerHTML: accentScript }],
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
