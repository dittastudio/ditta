<script lang="ts" setup>
import type { PageStoryblok } from '@@/types/storyblok'

const route = useRoute()
const story = await useStory(route.path)

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

let rafId: number | null = null

const updateScrollProgress = () => {
  const scrollPosition = window.scrollY
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  const progress = Math.min(scrollPosition / maxScroll, 1)
  document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(2))
  rafId = null
}

const handleScroll = () => {
  if (!rafId) {
    rafId = requestAnimationFrame(updateScrollProgress)
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  updateScrollProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
})
</script>

<template>
  <div>
    <UiStickyLogo>
      <AppWorkItems
        v-if="story.content"
        :content="(story.content as PageStoryblok)"
      />
      <!-- <UiWork
        :index="1"
        ratio="16/9"
        :rotation="3"
        :col-start="4"
        :col-end="10"
      >
        <img
          src="/imgs/luca-test.jpg"
          alt="Luca"
          class="w-full h-full object-cover"
        >
      </UiWork>

      <UiWork
        :index="2"
        ratio="1/1"
        :rotation="-6"
        :col-start="8"
        :col-end="12"
      >
        <video
          src="/videos/haven-vid.mp4"
          class="w-full h-full object-cover"
          autoplay
          muted
          loop
          playsinline
        />
      </UiWork>

      <UiWork
        :index="3"
        ratio="5/8"
        :rotation="9"
        :col-start="2"
        :col-end="5"
      >
        <img
          src="/imgs/haven.jpg"
          alt="Luca"
          class="w-full h-full object-cover"
        >
      </UiWork>

      <UiWork
        :index="4"
        ratio="16/9"
        :rotation="-3"
        :col-start="4"
        :col-end="11"
      >
        <video
          src="/videos/luca-test.mp4"
          class="w-full h-full object-cover"
          autoplay
          muted
          loop
          playsinline
        />
      </UiWork> -->
    </UiStickyLogo>

    <AppComponents
      v-if="story.content"
      :content="(story.content as PageStoryblok)"
    />
  </div>
</template>

<style>
html {
  --start-color: var(--color-pink);
  --middle-color: var(--color-beige);
  --end-color: var(--color-lightgrey);

  /* Scroll progress (0 to 1) */
  --scroll-progress: 0;

  /* Calculate transition phases */
  --first-phase-progress: clamp(0, var(--scroll-progress) * 2, 1);
  --second-phase-progress: clamp(0, (var(--scroll-progress) - 0.5) * 2, 1);

  /* Calculate color mix percentages */
  --start-to-middle: calc((1 - var(--first-phase-progress)) * 100%);
  --middle-to-end: calc((1 - var(--second-phase-progress)) * 100%);
  --end-color-mix: calc(var(--second-phase-progress) * 200%);

  /* Fallback color */
  background-color: var(--start-color);
  background-color: color-mix(
    in srgb,
    var(--start-color) var(--start-to-middle),
    color-mix(
      in srgb,
      var(--middle-color) var(--middle-to-end),
      var(--end-color) var(--end-color-mix)
    )
  );
  transition: background-color 0.1s var(--ease-out);
}
</style>
