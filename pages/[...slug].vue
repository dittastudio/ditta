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
    fatal: false
  })
}

const { seo_title, seo_description, seo_image } = story.value.content

useSeoMeta({
  title: seo_title ?? story.value.name,
  ogTitle: seo_title ?? story.value.name,
  description: seo_description,
  ogDescription: seo_description,
  ogImage: storyblokImage(seo_image?.filename, { width: 1230, height: 630 }) || null,
  ogType: 'website',
  twitterTitle: seo_title ?? story.value.name,
  twitterCard: 'summary_large_image'
})

onMounted(() => {
  if (story.value) {
    useStoryblokBridge(story.value.id, (evStory: any) => (story.value = evStory), {
      preventClicks: true
    })
  }
})
</script>

<template>
  <div class="page__wrapper wrapper">
    <IconDitta class="page__icon" />
    <h1 class="page__hidden">ditta</h1>
    <p><a class="page__link" href="mailto:hello@ditta.studio">hello@ditta.studio</a></p>
  </div>
</template>

<style lang="postcss" scoped>
.page__wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.page__icon {
  --icon-size: 25%;

  width: var(--icon-size);
  height: auto;

  color: theme('colors.offblack');

  /* filter: drop-shadow(0 0 5px theme('colors.white/0.5')); */
  /* animation: 3s infinite theme('transitionTimingFunction.smooth') icon-pulse; */
}

.page__hidden {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

.page__link {
  color: theme('colors.white');
  text-decoration: none;
  font-weight: 700;
  font-size: clamp(1rem, 2vw, 4rem);
  line-height: 1.5;
  transition: .25s theme('transitionTimingFunction.smooth');

  &:hover {
    color: theme('colors.offblack');
  }
}

/* @keyframes icon-pulse {
  0% {
    color: theme('colors.pink/0.7');
    filter: drop-shadow(0 0 5px theme('colors.white/0.5'));
  }

  50% {
    color: theme('colors.pink/1');
    filter: drop-shadow(0 0 5px theme('colors.white/1'));
  }

  100% {
    color: theme('colors.pink/0.7');
    filter: drop-shadow(0 0 5px theme('colors.white/0.5'));
  }
} */
</style>