<script lang="ts" setup>
import type { PageStoryblok } from '@@/types/storyblok'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import IconDitta from '@/assets/icons/ditta.svg'

gsap.registerPlugin(ScrollTrigger)

const route = useRoute()
const story = await useStory(route.path)

const content = story.value.content as PageStoryblok
const { seo_title, seo_description, seo_image } = content
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

const stickyRef = ref<HTMLElement | null>(null)
const logoRefs = ref<HTMLElement[]>([])
let rafId: number | null = null
let logoTrigger: ScrollTrigger | null = null

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

  if (stickyRef.value) {
    logoTrigger = ScrollTrigger.create({
      trigger: stickyRef.value,
      start: 'top top',
      end: 'center top',
      scrub: true,
      markers: false,
      animation: gsap.to(logoRefs.value, {
        y: index => `-${100 * index}%`,
        ease: 'power2.inOut',
      }),
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
  if (logoTrigger) {
    logoTrigger.kill()
  }
})
</script>

<template>
  <div>
    <div
      ref="stickyRef"
      class="page-header"
    >
      <div class="page-header__sticky wrapper sticky top-0 flex flex-col items-center justify-end">
        <div class="page-header__grid relative w-full contain-layout">
          <div
            v-for="i in 5"
            :key="i"
            ref="logoRefs"
            class="page-header__grid-item w-full pb-[var(--app-outer-gutter)]"
          >
            <IconDitta class="page-header__logo w-full h-auto" />
          </div>
        </div>

        <h1 class="sr-only">
          ditta
        </h1>
      </div>
    </div>

    <AppComponents
      v-if="content"
      :content="content"
    />
  </div>
</template>

<style lang="postcss" scoped>
.page-header {
  min-height: 150vh;
  min-height: 150svh;
}

.page-header__sticky {
  min-height: 100vh;
  min-height: 100svh;
}

.page-header__grid {
  display: grid;
  grid-template-areas: "stack";
}

.page-header__grid-item {
  grid-area: stack;
}

.page-header__logo {
  max-height: calc(100svh - (var(--app-outer-gutter) * 2));
}
</style>

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
