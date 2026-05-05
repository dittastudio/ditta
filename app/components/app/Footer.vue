<script lang="ts" setup>
import type { StoryblokRichtext } from '#storyblok-types'

interface Props {
  text?: StoryblokRichtext
}

const { text } = defineProps<Props>()
</script>

<template>
  <footer class="bg-black text-grey min-h-screen flex">
    <div class="wrapper w-full pt-(--app-vertical-rhythm) pb-10 flex flex-col justify-between gap-6">
      <div
        v-if="storyblokRichTextContent(text)"
        :class="[
          'prose',
          'text-pretty',
          'prose-h2:text-heading',
          'prose-h2:max-w-[18em]',
          'prose-p:text-lead',
          'prose-p:text-beige',
          'prose-p:max-w-[23em]',
        ]"
      >
        <StoryblokText :html="text" />
      </div>

      <a href="mailto:hello@ditta.studio">
        <UiTextFit text="hello@ditta.studio" />
      </a>
    </div>
  </footer>
</template>
