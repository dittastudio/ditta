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

const line1 = ['Technical Brawn']
const line2 = ['Pixel Perfection']
const line3 = ['Aesthetic Drive']
const line4 = ['NI & AI']
const line6 = ['Digital Studio']
const line7 = ['HandMade']
const line8 = ['Openly Sourced']
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
      background-color="offblack"
      text-color="pink"
      :copy="line1"
      duration="60s"
    />

    <BlockHeading
      background-color="offwhite"
      text-color="offblack"
      :copy="line6"
      duration="80s"
      is-reversed
    />

    <BlockHeading
      background-color="offblack"
      text-color="orange"
      :copy="line3"
      duration="70s"
    />

    <BlockHeading
      background-color="blue"
      text-color="white"
      :copy="line2"
      duration="65s"
      is-reversed
    />

    <BlockHeading
      background-color="pink"
      text-color="offblack"
      :copy="line4"
      duration="85s"
    />

    <BlockHeading
      background-color="yellow"
      text-color="green"
      :copy="line7"
      duration="85s"
      is-reversed
    />

    <BlockHeading
      background-color="blue-light"
      text-color="red"
      :copy="line8"
      duration="75s"
    />
  </div>
</template>
