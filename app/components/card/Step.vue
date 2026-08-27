<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { StoryblokRichTextDoc } from '#storyblok-types'

interface Props {
  number?: string
  title?: string
  heading?: string
  copy?: StoryblokRichTextDoc
  theme?: Themes
}

const { number, title, heading, copy, theme } = defineProps<Props>()

defineOptions({
  inheritAttrs: false,
})

const mergedAttrs = useMergedAttrs('step-card w-full flex flex-col gap-y-20 rounded-20')
</script>

<template>
  <div
    v-bind="mergedAttrs"
    :class="theme ? themeClasses[theme] : ''"
  >
    <p
      v-if="number"
      class="text-display"
    >
      {{ number }}
    </p>

    <div class="flex flex-col gap-y-14 mt-auto">
      <h2
        class="text-heading text-balance trim-both whitespace-pre-wrap"
        v-if="title"
      >
        {{ title }}
      </h2>

      <div class="flex flex-col gap-3">
        <h3
          v-if="heading"
          class="text-subheading"
        >
          {{ heading }}
        </h3>

        <div
          v-if="storyblokRichTextContent(copy)"
          class="prose text-pretty prose-p:text-body prose-p:max-w-[30em] opacity-60"
        >
          <StoryblokText :html="copy" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.step-card {
  padding: utopia.clamp(16, 60);
}
</style>
