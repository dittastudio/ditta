<script lang="ts" setup>
import type { BlockWorkStoryblok } from '@@/types/storyblok'

interface Props {
  index: number
  block: BlockWorkStoryblok
}

const { index, block } = defineProps<Props>()
const assetType = computed(() => storyblokAssetType(block.media?.filename || ''))
</script>

<template>
  <div
    v-editable="block"
  >
    <UiWork
      :index="index"
      :rotation="block.rotation"
      :ratio="block.ratio"
      :col-start="block.column_start"
      :col-end="block.column_end"
    >
      <template #media>
        <MediaImageResponsive
          v-if="block.media && assetType === 'image'"
          :asset="block.media"
          :alt="block.media.alt || ''"
          :ratio="block.ratio"
          sizes="
            2xs:100vw
            xs:100vw
            sm:100vw
            md:100vw
          "
          :lazy="false"
        />
      </template>

      <template #caption>
        {{ block.caption }}
      </template>
    </UiWork>
  </div>
</template>
