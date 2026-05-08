<script lang="ts" setup>
import type { StoryblokRichtext } from '#storyblok-types'

interface Props {
  text?: StoryblokRichtext
}

const { text } = defineProps<Props>()

const email = 'hello@ditta.studio'
</script>

<template>
  <footer
    id="contact"
    class="bg-black text-grey min-h-screen flex"
  >
    <div class="wrapper w-full pt-25 md:pt-(--app-gutter-outer) pb-10 flex flex-col justify-between gap-6">
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

      <a
        class="footer__link block whitespace-nowrap text-center"
        href="mailto:hello@ditta.studio"
        aria-label="Email Ditta at hello@ditta.studio"
      >
        <UiTextMorph :text="email" />
      </a>
    </div>
  </footer>
</template>

<style scoped>
.footer__link {
  font-size: min(calc(9.5vw + 6px), 176px); /* magic number */
}
</style>
