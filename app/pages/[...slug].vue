<script lang="ts" setup>
import type { PageStoryblok } from '@@/types/storyblok'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import IconDitta from '@/assets/icons/ditta.svg'

gsap.registerPlugin(ScrollTrigger)

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

const logoRefs = ref<HTMLElement[]>([])
const logoRefTop = ref<HTMLElement | null>(null)
const logoRefBottom = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const bottomSectionRef = ref<HTMLElement | null>(null)

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

  const tlTop = gsap.timeline({
    scrollTrigger: {
      trigger: contentRef.value,
      start: 'top bottom',
      end: '20% bottom',
      scrub: true,
      markers: false,
    },
  })

  tlTop.fromTo(logoRefTop.value, {
    scale: 1,
    opacity: 1,
  }, {
    scale: 0.9,
    opacity: 0,
    ease: 'power2.inOut',
  }).fromTo(logoRefBottom.value, {
    scale: 1,
  }, {
    scale: 0.9,
    ease: 'power2.inOut',
  }, '<')

  const tlBottom = gsap.timeline({
    scrollTrigger: {
      trigger: bottomSectionRef.value,
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: true,
      markers: true,
    },
  })

  tlBottom.to(logoRefTop.value, {
    scale: 1,
    opacity: 1,
    ease: 'power2.inOut',
  }).to(logoRefBottom.value, {
    scale: 1,
    ease: 'power2.inOut',
  }, '<').to(logoRefs.value, {
    y: index => `-${100 * index}%`,
    ease: 'power2.inOut',
  }, '<0.5')
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
    <div>
      <div
        ref="logoRefTop"
        class="sticky top-0 z-10 min-h-screen flex items-end justify-center p-[var(--app-outer-gutter)] pointer-events-none"
      >
        <IconDitta
          class="page-header__logo w-full h-auto"
        />
      </div>

      <div
        ref="logoRefBottom"
        class="-mt-[100vh] sticky top-0 min-h-screen flex items-end justify-center pb-[var(--app-outer-gutter)] px-[var(--app-outer-gutter)]"
      >
        <div class="page-header__grid relative w-full contain-layout">
          <div
            v-for="i in 5"
            :key="i"
            ref="logoRefs"
            class="page-header__grid-item w-full pt-[var(--app-outer-gutter)]"
          >
            <IconDitta class="page-header__logo w-full h-auto" />
          </div>
        </div>

        <!-- <IconDitta
          class="page-header__logo w-full h-auto"
        /> -->
      </div>

      <div
        ref="contentRef"
        class="relative z-1 overflow-hidden wrapper pt-[calc(var(--app-outer-gutter)*2)] pb-[calc(var(--app-outer-gutter)*1)] flex flex-col gap-[calc(var(--app-outer-gutter)*4)]"
      >
        <UiWork
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
          :col-start="3"
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
        </UiWork>
      </div>

      <div
        ref="bottomSectionRef"
        class="min-h-[200vh]"
      />
    </div>

    <BlockComponents
      v-if="story.content"
      :content="(story.content as PageStoryblok)"
    />
  </div>
</template>

<style lang="postcss" scoped>
.page-header__grid {
  display: grid;
  grid-template-areas: "stack";
}

.page-header__grid-item {
  grid-area: stack;
}

.page-header__logo {
  max-height: calc(100svh - (var(--app-outer-gutter) * 4));
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
