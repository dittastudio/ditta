<script lang="ts" setup>
import type { Page, Post, Project } from '#storyblok-components'
import type { Themes } from '@/types/app'

const route = useRoute()
const relations = ['block_team.humans', 'block_projects.projects']

const story = await useStory<Page | Post | Project>(
  route.path,
  { resolve_relations: relations },
  { resolveRelations: relations },
)

const { seo_title, seo_description, seo_image } = story.value.content
const imageOptions = { width: 1200, height: 630, format: 'jpg', smart: true, quality: 90 }

useSeoMeta({
  title: seo_title ?? story.value.name,
  description: seo_description,
  ogTitle: seo_title ?? story.value.name,
  ogDescription: seo_description,
  ogImage: storyblokImage(seo_image?.filename, imageOptions) || null,
  ogImageWidth: imageOptions.width,
  ogImageHeight: imageOptions.height,
  ogType: 'website',
})

const appStore = useAppStore()
const first = computed(() => story.value.content.blocks?.[0])

onMounted(() => {
  if (first.value && 'theme' in first.value) {
    appStore.setTheme(first.value.theme as Themes)
  }
})
</script>

<template>
  <main class="w-full min-h-svh">
    <TemplatePage
      v-if="isPage(story)"
      :story="story"
    />

    <TemplatePost
      v-else-if="isPost(story)"
      :story="story"
    />

    <TemplateProject
      v-else-if="isProject(story)"
      :story="story"
    />
  </main>
</template>
