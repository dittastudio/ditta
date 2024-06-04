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
    backgroundColor: 'offblack',
    textColor: 'offwhite',
    copy: ['Obey'],
    duration: '60s',
  },
  {
    backgroundColor: 'offwhite',
    textColor: 'offblack',
    copy: ['Consume'],
    duration: '80s',
  },
  {
    backgroundColor: 'offblack',
    textColor: 'pink',
    copy: ['Subscribe'],
    duration: '70s',
  },
  {
    backgroundColor: 'pink',
    textColor: 'offblack',
    copy: ['Buy'],
    duration: '65s',
  },
  {
    backgroundColor: 'offblack',
    textColor: 'offwhite',
    copy: ['Conform'],
    duration: '85s',
  },
  {
    backgroundColor: 'offwhite',
    textColor: 'offblack',
    copy: ['Hire us'],
    duration: '75s',
  },
  {
    backgroundColor: 'offblack',
    textColor: 'pink',
    copy: ['Sleep'],
    duration: '60s',
  },
  {
    backgroundColor: 'pink',
    textColor: 'offblack',
    copy: ['Wake up'],
    duration: '80s',
  },
  {
    backgroundColor: 'offblack',
    textColor: 'offwhite',
    copy: ['Pay us'],
    duration: '70s',
  },
  {
    backgroundColor: 'offwhite',
    textColor: 'offblack',
    copy: ['Rest'],
    duration: '65s',
  },
]
</script>

<template>
  <div>
    <div class="wrapper flex flex-col items-center justify-center min-h-[100vh]">
      <IconDitta class="w-[27%] min-w-200 h-auto" />

      <h1 class="sr-only">
        ditta
      </h1>

      <a
        class="text-offwhite type-fluid-sm font-bold p-[1em] transition-opacity duration-200 ease-smooth hover:opacity-70"
        href="mailto:hello@ditta.studio"
      >
        hello@ditta.studio
      </a>
    </div>
    <!--
    <BlockScrollTest />

    <BlockCarousel :slides="slides">
      <template #default="{ slide }">
        <img
          v-if="slide.src && slide.type === 'image'"
          class="w-full h-full object-cover"
          :src="slide.src"
          :alt="slide.alt"
        >

        <video
          v-else-if="slide.src && slide.type === 'video'"
          class="w-full h-full object-cover"
          :src="slide.src"
          playsinline
          autoplay
          muted
          loop
        />

        <div
          v-else
          class="aspect-[3/2] w-full h-full flex items-center justify-center bg-offblack"
        >
          <div class="relative z-2 w-[25%]">
            <IconDitta class="w-full h-auto mx-auto" />
          </div>
        </div>
      </template>
    </BlockCarousel>  -->

    <BlockHeading
      v-for="(heading, index) in headings"
      :key="index"
      :background-color="heading.backgroundColor"
      :text-color="heading.textColor"
      :copy="heading.copy"
      :duration="heading.duration"
      :is-reversed="Boolean(index % 2)"
    />
  </div>
</template>
