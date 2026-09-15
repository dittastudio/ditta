<script setup lang="ts">
import type { AssetFieldValue } from '@storyblok/schema'

interface Props {
  name?: string | null
  position?: string | null
  image?: AssetFieldValue | null
}

const { name, position } = defineProps<Props>()
</script>

<template>
  <div class="flex flex-col gap-10">
    <UiPixelate class="rounded-20 squircle-40 overflow-hidden">
      <NuxtImg
        v-if="image?.filename && storyblokAssetType(image.filename) === 'image'"
        class="block size-full aspect-square object-cover rounded-20 squircle-40"
        :src="image.filename"
        :alt="image.alt || name || ''"
        loading="lazy"
      />
    </UiPixelate>

    <p class="text-lead trim-both">
      <strong v-if="name">{{ name }}</strong>
      <template v-if="position"><br v-if="name" />{{ position }}</template>
    </p>
  </div>
</template>
