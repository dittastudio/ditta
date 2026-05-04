<script lang="ts" setup>
import type { StoryblokAsset } from '#storyblok-types'

interface Props {
  title?: string
  image?: StoryblokAsset
}

const { title, image } = defineProps<Props>()
</script>

<template>
  <div class="relative card-work">
    <NuxtImg
      v-if="image?.filename && storyblokAssetType(image.filename) === 'image'"
      class="block size-full object-cover rounded-20"
      :src="image.filename"
      :alt="title || image.alt"
      loading="lazy"
    />

    <div class="absolute inset-0 p-10 flex items-end justify-start">
      <UiButton
        v-if="title"
        theme="light"
        :text="title"
      />
    </div>
  </div>
</template>

<style scoped>
.card-work {
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 16 / 9;
}
</style>
