<script lang="ts" setup>
import type { BlockTestimonial } from '#storyblok-components'

interface Props {
  block: BlockTestimonial
}

const { block } = defineProps<Props>()
const person = computed(() => (typeof block.person !== 'string' ? block.person : null))
</script>

<template>
  <div
    class="wrapper"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <figure class="flex flex-col gap-10 md:gap-18 max-w-[80ch] mx-auto text-center">
      <blockquote
        v-if="storyblokRichTextContent(block.quote)"
        class="prose text-pretty prose-p:text-heading"
      >
        <StoryblokText :html="block.quote" />
      </blockquote>

      <figcaption
        v-if="person"
        class="text-lead trim-both"
      >
        <strong>{{ person.content.name }}</strong>
        <template v-if="person.content.position"> <br />{{ person.content.position }} </template>
      </figcaption>
    </figure>
  </div>
</template>
