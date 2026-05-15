<script lang="ts" setup>
import type { BlockTestimonial } from '#storyblok-components'

interface Props {
  block: BlockTestimonial
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="wrapper grid grid-cols-1 md:grid-cols-12 gap-(--app-gutter-inner)"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <figure class="md:col-start-2 md:col-span-10 flex flex-col gap-10 md:gap-25">
      <blockquote
        v-if="storyblokRichTextContent(block.quote)"
        class="relative prose text-heading text-pretty prose-p:text-heading prose-p:trim-both"
      >
        <StoryblokText :html="block.quote" />
      </blockquote>

      <figcaption
        v-if="block.name"
        class="flex items-center gap-5"
      >
        <NuxtImg
          v-if="block.image && block.image.filename && storyblokAssetType(block.image.filename) === 'image'"
          class="block size-14 md:size-18 object-cover rounded-full"
          :src="block.image.filename"
          :alt="block.name || block.image.alt"
          width="72"
          height="72"
          density="1x, 2x"
          loading="lazy"
        />

        <div class="flex flex-col text-body">
          <strong>{{ block.name }}</strong>
          <template v-if="block.position">{{ block.position }}</template>
        </div>
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
@reference "@/assets/css/app.css";

blockquote {
  quotes: '“' '”';

  &::before,
  &::after {
    display: block;
    margin-left: -0.04em;
    margin-bottom: -0.4em;
    font-size: 4.1em;
    line-height: 1;
  }

  &::before {
    content: open-quote;

    @variant md {
      position: absolute;
      top: -0.172em;
      left: -0.652em;
    }
  }

  &::after {
    content: close-quote;
    position: absolute;
    bottom: -0.195em;
    right: -0.645em;

    @variant max-md {
      display: none;
    }
  }
}
</style>
