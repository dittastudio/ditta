<script lang="ts" setup>
import type { Block } from '#storyblok-schema'

interface Props {
  block: Block<'block_testimonial'>
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

      <figcaption v-if="block.name">
        <UiAvatar
          :image="block.image"
          :name="block.name"
          :position="block.position"
        />
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
