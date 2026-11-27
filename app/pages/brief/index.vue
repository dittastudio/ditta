<script lang="ts" setup>
import type { Block } from '#storyblok-schema'

// The brief builder (docs/plans/brief-builder.md). The page is prerendered, for its title and link preview, but the
// brief itself is client-only: it lives in the visitor's browser (see routeRules in nuxt.config.ts). Its intro
// and SEO come from the `brief` story in Storyblok, so it can be linked and edited there; the questions stay in code
// (shared/utils/brief.ts), as the server checks answers against them. Until the story arrives, or if it can't be had,
// this wording stands in, so the brief never waits on Storyblok or breaks without it.
definePageMeta({ tagline: false, theme: 'dark' })

const fallback = {
  introHeading: 'Create your brief',
  introCopy: 'A few quick questions about you and your project.\nOnly takes a few minutes.',
  seoTitle: 'Start a brief',
  seoDescription: 'Tell us about your project in a few quick questions, and we’ll reply within two working days.',
}

const config = useRuntimeConfig()
const route = useRoute()
const preview = storyblokEditor(route.query)

const { story } = await useAsyncStoryblok('brief', {
  api: { version: config.public.STORYBLOK_VERSION === 'published' ? 'published' : 'draft' },
  bridge: { preventClicks: true },
  // Waited for when prerendering, so the link preview has the story's SEO, but never on a navigation in the browser
  lazy: import.meta.client,
})

const content = computed(() => (story.value?.content as Block<'brief'> | undefined) ?? null)
const introHeading = computed(() => content.value?.intro_heading?.trim() || fallback.introHeading)
const introCopy = computed(() => content.value?.intro_copy?.trim() || fallback.introCopy)

const imageOptions = { width: 1200, height: 630, format: 'jpg', smart: true, quality: 90 }
const seoTitle = computed(() => content.value?.seo_title?.trim() || fallback.seoTitle)
const seoDescription = computed(() => content.value?.seo_description?.trim() || fallback.seoDescription)

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  // Set once, here in setup, where storyblokImage's useImage() can reach Nuxt. The prerender has the story by now, and
  // only crawlers read the image
  ogImage: storyblokImage(content.value?.seo_image?.filename, imageOptions) || null,
  ogType: 'website',
})

const appStore = useAppStore()

onMounted(() => {
  appStore.setTheme('dark')
})
</script>

<template>
  <div v-editable="content ?? undefined">
    <ClientOnly>
      <BriefShell
        :intro-heading="introHeading"
        :intro-copy="introCopy"
        :preview="preview"
      />
      <template #fallback>
        <div class="min-h-svh bg-black" />
      </template>
    </ClientOnly>
  </div>
</template>
