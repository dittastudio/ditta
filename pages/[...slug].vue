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

// const slides = [
//   {
//     src: '/imgs/luca-test-2.jpg',
//     alt: 'Ditta Studio',
//     type: 'image',
//   },
//   {
//     src: '/videos/luca-test.mp4',
//     alt: 'Ditta Studio',
//     type: 'video',
//   },
//   {
//     src: '',
//     alt: 'Ditta Studio',
//     type: 'image',
//   },
//   {
//     src: '',
//     alt: 'Ditta Studio',
//     type: 'image',
//   },
// ]

const headings = [
  {
    backgroundColor: 'black',
    textColor: 'offwhite',
    copy: ['Obey'],
    duration: '60s',
  },
  {
    backgroundColor: 'offwhite',
    textColor: 'black',
    copy: ['Consume'],
    duration: '80s',
  },
  {
    backgroundColor: 'black',
    textColor: 'pink',
    copy: ['Like'],
    duration: '70s',
  },
  {
    backgroundColor: 'pink',
    textColor: 'black',
    copy: ['Subscribe'],
    duration: '65s',
  },
  {
    backgroundColor: 'black',
    textColor: 'offwhite',
    copy: ['Upgrade'],
    duration: '85s',
  },
  {
    backgroundColor: 'offwhite',
    textColor: 'black',
    copy: ['Conform'],
    duration: '75s',
  },
  {
    backgroundColor: 'black',
    textColor: 'pink',
    copy: ['Hire us'],
    duration: '60s',
  },
  {
    backgroundColor: 'pink',
    textColor: 'black',
    copy: ['Sleep'],
    duration: '80s',
  },
  {
    backgroundColor: 'offwhite',
    textColor: 'black',
    copy: ['Wake up'],
    duration: '70s',
  },
  {
    backgroundColor: 'black',
    textColor: 'offwhite',
    copy: ['Pay up'],
    duration: '65s',
  },
  {
    backgroundColor: 'pink',
    textColor: 'black',
    copy: ['Repeat'],
    duration: '85s',
  },
]
</script>

<template>
  <div>
    <div class="wrapper flex flex-col items-center justify-end min-h-[100svh] pb-[var(--app-outer-gutter)]">
      <IconDitta class="w-full h-auto" />

      <h1 class="sr-only">
        ditta
      </h1>
    </div>

    <!-- <BlockScrollTest />

    <BlockCarousel :slides="slides">
      <template #default="{ slide }">
        <img
          v-if="slide.src && slide.type === 'image'"
          class="object-cover w-full h-full"
          :src="slide.src"
          :alt="slide.alt"
        >

        <video
          v-else-if="slide.src && slide.type === 'video'"
          class="object-cover w-full h-full"
          :src="slide.src"
          playsinline
          autoplay
          muted
          loop
        />

        <div
          v-else
          class="aspect-[3/2] w-full h-full flex items-center justify-center bg-black"
        >
          <div class="relative z-2 w-[25%]">
            <IconDitta class="w-full h-auto mx-auto" />
          </div>
        </div>
      </template>
    </BlockCarousel> -->

    <BlockHeading
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
