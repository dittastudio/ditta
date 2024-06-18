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

const headings = [
  {
    backgroundColor: 'offblack',
    textColor: 'pink',
    copy: ['Hire us'],
    duration: '60s',
  },
  {
    backgroundColor: 'pink',
    textColor: 'offblack',
    copy: ['Sleep'],
    duration: '80s',
  },
  {
    backgroundColor: 'offwhite',
    textColor: 'offblack',
    copy: ['Wake up'],
    duration: '70s',
  },
  {
    backgroundColor: 'offblack',
    textColor: 'offwhite',
    copy: ['Pay up'],
    duration: '65s',
  },
  {
    backgroundColor: 'pink',
    textColor: 'offblack',
    copy: ['Repeat'],
    duration: '85s',
  },
]
</script>

<template>
  <div>
    <BlockComponents :content="story.content" />

    <ElementMarquee
      v-for="(heading, index) in headings"
      :key="index"
      :background-color="heading.backgroundColor"
      :text-color="heading.textColor"
      :copy="heading.copy"
      :duration="heading.duration"
      :direction="index % 2 ? 'right' : 'left'"
    />
  </div>
</template>
