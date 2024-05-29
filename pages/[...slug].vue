<script lang="ts" setup>
import { storyblokImage } from '@/utilities/helpers'
import type { PageStoryblok } from '@/types/storyblok'
import IconDitta from '@/assets/icons/ditta.svg'

const route = useRoute()
const story = await useStory<PageStoryblok>(route.path)

if (!story.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `Page not found`,
    fatal: false,
  })
}

const { seo_title, seo_description, seo_image } = story.value.content?.seo[0]

useSeoMeta({
  title: seo_title ?? story.value.name,
  description: seo_description,
  ogTitle: seo_title ?? story.value.name,
  ogDescription: seo_description,
  ogImage: storyblokImage(seo_image?.filename, { width: 1230, height: 630 }) || null,
  ogType: 'website',
  twitterTitle: seo_title ?? story.value.name,
  twitterCard: 'summary_large_image',
  twitterImage: storyblokImage(seo_image?.filename, { width: 1230, height: 630 }) || null,
})

onMounted(() => {
  if (story.value) {
    useStoryblokBridge(story.value.id, (evStory: any) => (story.value = evStory), {
      preventClicks: true,
    })
  }
})
</script>

<template>
  <div>
    <div class="wrapper flex flex-col gap-24 items-center justify-center min-h-[100vh]">
      <IconDitta class="w-[25%] min-w-200 h-auto" />

      <h1 class="sr-only">
        ditta
      </h1>

      <a class="text-offwhite text-fluid-18-24" href="mailto:hello@ditta.studio">hello@ditta.studio</a>
    </div>

    <BlockHeading theme="offwhite" copy="Technical Brawn" />

    <BlockHeading theme="blue" copy="Pixel Perfection" />

    <BlockHeading theme="offblack" copy="Bridging the gap" />

    <BlockHeading theme="pink" copy="Bridging the gap" />

    <BlockHeading theme="white" copy="Bridging the gap" />
  </div>
</template>
