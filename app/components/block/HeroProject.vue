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
        v-if="
          block.image_desktop &&
          block.image_desktop.filename &&
          storyblokAssetType(block.image_desktop.filename) === 'image'
        "
        media="(orientation: landscape)"
        :width="16"
        :height="9"
        :src="block.image_desktop.filename"
        sizes="sm:100vw md:100vw lg:100vw"
      />

      <MediaSource
        :media="block.image.filename ? '(orientation: portrait)' : undefined"
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

    <div class="hero-project__content self-end col-start-1 row-start-1">
      <div class="wrapper pb-15 md:pb-25 flex flex-col gap-10">
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

<style>
.hero-project__content {
  position: relative;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200%;
    z-index: -1;
    pointer-events: none;
    backdrop-filter: blur(4px);
    background-color: --alpha(var(--color-black) / 30%);
    mask-image: linear-gradient(to bottom, transparent 0%, black 100%);
  }
}
</style>
