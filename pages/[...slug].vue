<script lang="ts" setup>
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { storyblokImage } from '@/utilities/helpers'
import type { PageStoryblok } from '@/types/storyblok'
import IconDitta from '@/assets/icons/ditta.svg'

gsap.registerPlugin(ScrollTrigger)

const route = useRoute()
const story = await useStory<PageStoryblok>(route.path)
const stickyRef = ref<HTMLElement | null>(null)

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
const logoRefs = ref<HTMLElement[]>([])

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

  if (stickyRef.value) {
    gsap.to(logoRefs.value, {
      scrollTrigger: {
        trigger: stickyRef.value,
        start: 'top top',
        end: 'center top',
        scrub: true,
        markers: false,
      },
      y: index => `-${100 * (index + 1)}%`,
      ease: 'power2.inOut',
    })
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
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
    <div
      ref="stickyRef"
      class="page-header"
    >
      <div class="page-header__sticky sticky top-0 wrapper flex flex-col items-center justify-end">
        <div class="relative w-full contain-layout py-[var(--app-outer-gutter)]">
          <IconDitta class="page-header__logo w-full h-auto" />

          <div
            v-for="i in 4"
            :key="i"
            ref="logoRefs"
            class="w-full absolute top-0 left-0 -z-1 pt-[var(--app-outer-gutter)]"
          >
            <IconDitta class="page-header__logo-mask text-black w-full h-auto" />
          </div>
        </div>

        <h1 class="sr-only">
          ditta
        </h1>
      </div>
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

<style lang="postcss" scoped>
.page-header {
  min-height: 150vh;
  min-height: 150svh;
}

.page-header__sticky {
  min-height: 100vh;
  min-height: 100svh;
}

.page-header__logo,
.page-header__logo-mask {
  max-height: calc(100svh - (var(--app-outer-gutter) * 2));
}
</style>

<style>
html {
  --start-color: theme('colors.pink');
  --middle-color: theme('colors.beige');
  --end-color: theme('colors.lightgrey');

  /* Scroll progress (0 to 1) */
  --scroll-progress: 0;

  /* Calculate transition phases */
  --first-phase-progress: min(var(--scroll-progress) * 2, 1);
  --second-phase-progress: min(max((var(--scroll-progress) - 0.5) * 2, 0), 1);

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
  transition: background-color 0.1s theme('transitionTimingFunction.out');
}
</style>
