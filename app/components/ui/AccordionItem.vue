<script lang="ts" setup>
import type { StoryblokRichTextDoc } from '#storyblok-types'
import IconPlus from '@/assets/icons/plus.svg'

interface Props {
  heading?: string
  copy?: StoryblokRichTextDoc
}

const { heading, copy } = defineProps<Props>()
</script>

<template>
  <details class="accordion-item group w-full bg-white/5">
    <summary
      v-if="heading"
      class="w-full p-6 md:p-8 select-none cursor-pointer flex items-center justify-start gap-6 md:gap-8 text-20 font-medium trim-both"
    >
      <IconPlus class="accordion-item__cross block size-6" />
      {{ heading }}
    </summary>

    <div
      v-if="storyblokRichTextContent(copy)"
      class="w-full pl-18 pr-6 pb-6 md:pl-21.5 md:pr-8 md:pb-8 opacity-0 transition-opacity duration-250 ease-out delay-0 group-open:starting:opacity-0 group-open:opacity-60 group-open:duration-500 group-open:delay-200 prose text-balance"
    >
      <StoryblokText :html="copy" />
    </div>
  </details>
</template>

<style lang="postcss" scoped>
.accordion-item__cross {
  animation: rotate-reset 0.5s var(--ease-outBack) 0.2s both;

  .accordion-item[open] & {
    animation: rotate-open 0.5s var(--ease-out) both;
  }
}

@keyframes rotate-open {
  0% {
    rotate: 0deg;
  }

  100% {
    rotate: 45deg;
  }
}

@keyframes rotate-reset {
  0% {
    rotate: 45deg;
  }

  99.999% {
    rotate: 90deg;
  }

  100% {
    rotate: 0deg;
  }
}
</style>
