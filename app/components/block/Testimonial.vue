<script lang="ts" setup>
import IconQuotes from '@/assets/icons/quotes.svg'
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
        class="relative prose text-pretty prose-p:text-heading prose-p:trim-both"
      >
        <IconQuotes class="text-heading w-[1.05em] h-[0.875em] md:absolute mb-[1em] top-0 left-[-2.5em]" />
        <IconQuotes
          class="max-md:hidden text-heading w-[1.05em] h-[0.875em] absolute bottom-0 right-[-2.5em] scale-[-1]"
        />

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
          width="80"
          height="80"
          density="1x, 2x"
          loading="lazy"
        />

        <div class="flex flex-col text-body">
          <strong>{{ block.name }}</strong>
          <template v-if="block.position">{{ block.position }} </template>
        </div>
      </figcaption>
    </figure>
  </div>
</template>
