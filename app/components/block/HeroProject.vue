<script lang="ts" setup>
import type { BlockHeroProject } from '#storyblok-components'

interface Props {
  block: BlockHeroProject
}

const { block } = defineProps<Props>()
</script>

<template>
  <div class="isolate grid grid-cols-1 grid-rows-1 h-[calc(100svh---spacing(10))] w-full">
    <picture
      v-if="block.image && block.image.filename && storyblokAssetType(block.image.filename) === 'image'"
      class="col-start-1 row-start-1"
    >
      <MediaSource
        media="(orientation: landscape)"
        :width="16"
        :height="9"
        :src="block.image.filename"
        sizes="sm:100vw md:100vw lg:100vw"
      />

      <MediaSource
        media="(orientation: portrait)"
        :width="10"
        :height="16"
        :src="block.image.filename"
        sizes="2xs:100vw xs:100vw sm:100vw"
      />

      <NuxtImg
        srcset=""
        class="size-full object-cover"
        :src="block.image.filename"
        :alt="block.image.alt"
        loading="eager"
        preload
      />
    </picture>

    <div class="hero-project__text col-start-1 row-start-1 self-end wrapper pb-15 md:pb-25">
      <div class="flex flex-col gap-10 md:gap-20">
        <h1
          v-if="block.heading"
          class="text-display text-balance trim-both"
        >
          {{ block.heading }}
        </h1>

        <div
          v-if="storyblokRichTextContent(block.copy)"
          class="prose prose-p:text-lead text-pretty trim-both"
        >
          <StoryblokText :html="block.copy" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-project__text {
  --_gradient-color: white;

  position: relative;
  z-index: 0;

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 150%;
    z-index: -1;
    pointer-events: none;
    opacity: 0.5;
    background-image: linear-gradient(
      to top,
      --alpha(var(--_gradient-color) / 100%) 0%,
      --alpha(var(--_gradient-color) / 98.7%) 8.1%,
      --alpha(var(--_gradient-color) / 95.1%) 15.5%,
      --alpha(var(--_gradient-color) / 89.6%) 22.5%,
      --alpha(var(--_gradient-color) / 82.5%) 29%,
      --alpha(var(--_gradient-color) / 74.1%) 35.3%,
      --alpha(var(--_gradient-color) / 64.8%) 41.2%,
      --alpha(var(--_gradient-color) / 55%) 47.1%,
      --alpha(var(--_gradient-color) / 45%) 52.9%,
      --alpha(var(--_gradient-color) / 35.2%) 58.8%,
      --alpha(var(--_gradient-color) / 25.9%) 64.7%,
      --alpha(var(--_gradient-color) / 17.5%) 71%,
      --alpha(var(--_gradient-color) / 10.4%) 77.5%,
      --alpha(var(--_gradient-color) / 4.9%) 84.5%,
      --alpha(var(--_gradient-color) / 1.3%) 91.9%,
      --alpha(var(--_gradient-color) / 0%) 100%
    );
  }
}
</style>
