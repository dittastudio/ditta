<script lang="ts" setup>
import type { StoryblokRichTextDoc } from '#storyblok-types'
import IconPlus from '@/assets/icons/plus.svg'
import { defineSound } from '@web-kits/audio'
import { drawerOpen, drawerClose, hover } from '@@/.web-kits/core'

interface Props {
  heading?: string
  copy?: StoryblokRichTextDoc
}

const { heading, copy } = defineProps<Props>()

const soundPageEnter = defineSound(drawerOpen)
const soundPageExit = defineSound(drawerClose)
const soundHover = defineSound(hover)
const { play } = useAudio()

function handleToggle(event: Event) {
  const details = event.target as HTMLDetailsElement
  play(details.open ? soundPageEnter : soundPageExit)
}
</script>

<template>
  <details
    class="accordion-item group w-full bg-white/7.5"
    @toggle="handleToggle"
    @pointerenter="play(soundHover)"
  >
    <summary
      v-if="heading"
      class="w-full p-6 pr-8 md:p-8 md:pr-10 select-none cursor-pointer flex items-start gap-6 md:gap-8 text-20 font-medium trim-both"
    >
      <IconPlus class="accordion-item__cross shrink-0 relative top-[0.09em] size-6" />
      <span class="block mt-[-0.08em]">{{ heading }}</span>
    </summary>

    <div
      v-if="storyblokRichTextContent(copy)"
      class="w-full pl-18 pr-10 pb-10 md:pl-21.5 md:pr-12 md:pb-12 opacity-0 transition-opacity duration-250 ease-out delay-0 group-open:starting:opacity-0 group-open:opacity-60 group-open:duration-500 group-open:delay-200 prose text-balance"
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
