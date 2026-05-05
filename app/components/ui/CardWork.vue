<script lang="ts" setup>
// import type { StoryblokAsset } from '#storyblok-types'

interface Props {
  title?: string
}

const { title } = defineProps<Props>()
</script>

<template>
  <div class="relative max-w-full max-h-full aspect-[inherit]">
    <slot />

    <div class="absolute inset-0 p-10 flex items-end justify-start">
      <UiButton
        v-if="title"
        theme="light"
        :text="title"
      />
    </div>
  </div>
</template>
