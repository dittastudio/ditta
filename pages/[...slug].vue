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

const scrollProgress = ref(0)
let ticking = false
let rafId: number | null = null

const updateScrollProgress = () => {
  const scrollPosition = window.scrollY
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = Math.min(scrollPosition / maxScroll, 1)

  document.documentElement.style.setProperty('--scroll-progress', scrollProgress.value.toString())

  ticking = false
}

const handleScroll = () => {
  if (!ticking) {
    ticking = true
    rafId = requestAnimationFrame(updateScrollProgress)
  }
}

onMounted(() => {
  if (story.value) {
    useStoryblokBridge(story.value.id, (evStory: any) => (story.value = evStory), {
      preventClicks: true,
    })
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
  // Initial call to set initial state
  updateScrollProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
})

const headings = [
  {
    copy: ['Obey'],
    duration: '60s',
  },
  {
    copy: ['Consume'],
    duration: '80s',
  },
  {
    copy: ['Like'],
    duration: '70s',
  },
  {
    copy: ['Subscribe'],
    duration: '65s',
  },
  {
    copy: ['Upgrade'],
    duration: '85s',
  },
  {
    copy: ['Conform'],
    duration: '75s',
  },
  {
    copy: ['Hire us'],
    duration: '60s',
  },
  {
    copy: ['Sleep'],
    duration: '80s',
  },
  {
    copy: ['Wake up'],
    duration: '70s',
  },
  {
    copy: ['Pay up'],
    duration: '65s',
  },
  {
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

    <BlockHeading
      v-for="(heading, index) in headings"
      :key="index"
      :copy="heading.copy"
      :duration="heading.duration"
      :direction="index % 2 ? 'right' : 'left'"
    />
  </div>
</template>
