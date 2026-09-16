<script lang="ts" setup>
import type { AssetFieldValue } from '@storyblok/schema'

interface Props {
  image: AssetFieldValue | null
  name: string
  position?: string | null
}

const { image, name, position } = defineProps<Props>()
</script>

<template>
  <div class="flex items-center gap-5">
    <NuxtImg
      v-if="image && image.filename && storyblokAssetType(image.filename) === 'image'"
      class="block size-12 md:size-14 object-cover rounded-full"
      :src="image.filename"
      :alt="name || image.alt"
      width="56"
      height="56"
      density="1x, 2x"
      loading="lazy"
    />

    <div class="flex flex-col text-body">
      <strong>{{ name }}</strong>
      <template v-if="position">{{ position }}</template>
    </div>
  </div>
</template>
