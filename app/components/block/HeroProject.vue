<script lang="ts" setup>
import type { BlockHeroProject } from '#storyblok-components'

interface Props {
  block: BlockHeroProject
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="h-svh grid w-full grid-cols-1 grid-rows-1"
  >
    <picture
      v-if="block.image && block.image.filename && storyblokAssetType(block.image.filename) === 'image'"
      class="col-start-1 row-start-1"
    >
      <MediaSource
        media="(orientation: landscape)"
        :width="16"
        :height="9"
        :src="block.image.filename"
        :focus="block.image.focus"
        sizes="sm:100vw md:100vw lg:100vw"
      />

      <MediaSource
        media="(orientation: portrait)"
        :width="10"
        :height="16"
        :src="block.image.filename"
        :focus="block.image.focus"
        sizes="2xs:100vw xs:100vw sm:100vw"
      />

      <NuxtImg
        srcset=""
        class="size-full object-cover"
        :src="block.image.filename"
        :alt="block.image.alt"
        :modifiers="block.image.focus ? { filters: { focal: block.image.focus } } : undefined"
        loading="eager"
        preload
      />
    </picture>

    <div class="hero-project__content col-start-1 row-start-1">
      <div class="wrapper pb-15 md:pb-25 h-full flex flex-col justify-end gap-10">
        <h1
          v-if="block.heading"
          class="text-display text-balance trim-both mt-20"
        >
          <UiTextMorph
            :text="block.heading"
            :min-weight="400"
          />
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
.hero-project__content {
  position: relative;
  z-index: 1;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 50%;
    z-index: -1;
    pointer-events: none;
    backdrop-filter: blur(4px);
    background-color: --alpha(var(--color-black) / 30%);
  }

  &::before {
    top: 0;
    mask-image: linear-gradient(to top, transparent 0%, var(--color-black) 100%);
  }

  &::after {
    bottom: 0;
    mask-image: linear-gradient(to bottom, transparent 0%, var(--color-black) 100%);
  }
}
</style>
