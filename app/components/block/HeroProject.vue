<script lang="ts" setup>
import type { BlockHeroProject } from '#storyblok-components'

interface Props {
  block: BlockHeroProject
}

const { block } = defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-1 grid-rows-1 h-[calc(100svh---spacing(10))] w-full">
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

    <div class="col-start-1 row-start-1 self-end wrapper pb-15 md:pb-25">
      <div class="flex flex-col gap-10">
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
