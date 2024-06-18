<script lang="ts" setup>
import type { BlockMediaStoryblok } from '@/types/storyblok'
import { storyblokAssetType } from '@/utilities/storyblok'

interface Props {
  block: BlockMediaStoryblok
}

const { block } = defineProps<Props>()
const assetType = computed(() => storyblokAssetType(block.media?.filename || ''))
</script>

<template>
  <div v-editable="block">
    <MediaImage
      v-if="block.media && assetType === 'image'"
      class="block-media__media"
      :asset="block.media"
      :ratio="block.ratio"
      sizes="
        100vw
        sm:100vw
      "
    />

    <MediaVideo
      v-else-if="block.media && assetType === 'video'"
      class="block-media__media"
      :asset="block.media"
      :ratio="block.ratio"
    />
  </div>
</template>
