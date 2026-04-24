<script lang="ts" setup>
import type { Page } from '#storyblok-components'

const route = useRoute()

const relations: string[] = []

const story = await useStory<Page>(
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
  ogType: 'website',
  twitterTitle: seo_title ?? story.value.name,
  twitterCard: 'summary_large_image',
  twitterImage: storyblokImage(seo_image?.filename, imageOptions) || null,
})
</script>

<template>
  <div>
    <h1>Page</h1>

    <pre>{{ story.content }}</pre>
  </div>
</template>
