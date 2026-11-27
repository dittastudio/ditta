<script lang="ts" setup>
import type { Block } from '#storyblok-schema'

// The brief builder (docs/plans/brief-builder.md). Client-only: see routeRules in nuxt.config.ts. Its intro and SEO
// come from the `brief` story in Storyblok, so it can be linked and edited there; the questions stay in code
// (shared/utils/brief.ts), as the server checks answers against them. Until the story arrives, or if it can't be had,
// this wording stands in, so the brief never waits on Storyblok or breaks without it.
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
  lazy: true,
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
  ogImage: () => storyblokImage(content.value?.seo_image?.filename, imageOptions) || null,
  ogType: 'website',
})

const appStore = useAppStore()

onMounted(() => {
  appStore.setTheme('dark')
})
</script>

<template>
  <div v-editable="content ?? undefined">
    <BriefShell
      :intro-heading="introHeading"
      :intro-copy="introCopy"
      :preview="preview"
    />
  </div>
</template>
