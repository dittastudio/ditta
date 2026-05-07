<script setup lang="ts">
import type { StoryblokAsset } from '#storyblok-types'

interface Props {
  name?: string
  position?: string
  image?: StoryblokAsset
}

const { name, position } = defineProps<Props>()
</script>

<template>
  <div class="flex flex-col gap-10">
    <NuxtImg
      v-if="image?.filename && storyblokAssetType(image.filename) === 'image'"
      class="block size-full aspect-square object-cover rounded-20 squircle-40"
      :src="image.filename"
      :alt="image.alt || name || ''"
      loading="lazy"
    />

    <p class="text-lead trim-both">
      <strong v-if="name">{{ name }}</strong>
      <template v-if="position"><br v-if="name" />{{ position }}</template>
    </p>
  </div>
</template>
