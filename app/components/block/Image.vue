<script lang="ts" setup>
import type { BlockImageStoryblok } from '@@/types/storyblok'

interface Props {
  block: BlockImageStoryblok
}

const { block } = defineProps<Props>()
const assetType = computed(() => storyblokAssetType(block.media?.filename || ''))
</script>

<template>
  <div>
    <MediaImageResponsive
      v-if="block.media && assetType === 'image'"
      :asset="block.media"
      :desktop-asset="block.media"
      :ratio="block.ratio"
      :desktop-ratio="block.ratio_desktop"
      sizes="
        2xs:100vw
        xs:100vw
        sm:100vw
        md:100vw
      "
      desktop-sizes="
        md:100vw
        lg:100vw
        xl:100vw
        2xl:100vw
      "
    />
  </div>
</template>
