<script lang="ts" setup>
import type { BlockWorkStoryblok } from '@@/types/storyblok'

interface Props {
  index: number
  block: BlockWorkStoryblok
}

const { index, block } = defineProps<Props>()
const assetType = computed(() => storyblokAssetType(block.media?.filename || ''))
const columnSpan = computed(() => Number(block.column_end) - Number(block.column_start))

// Add 30% extra height for parallax effect
const adjustedRatio = computed(() => {
  if (!block.ratio || typeof block.ratio !== 'string') {
    return block.ratio
  }

  const parts = block.ratio.split(':')

  if (parts.length !== 2) {
    return block.ratio
  }

  const width = Number(parts[0])
  const height = Number(parts[1])

  if (Number.isNaN(width) || Number.isNaN(height)) {
    return block.ratio
  }

  const adjustedHeight = height * 1.3

  return `${width}:${adjustedHeight}`
})
</script>

<template>
  <div v-editable="block">
    <UiWork
      v-if="block.link"
      :link="block.link"
      :hover-color="block.hover_color?.color"
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
          :ratio="adjustedRatio"
          :sizes="`
            2xs:100vw
            xs:100vw
            sm:100vw
            md:${columnSpan / 12 * 100}vw
            lg:${columnSpan / 12 * 100}vw
            xl:${columnSpan / 12 * 100}vw
            xxl:${columnSpan / 12 * 1800}px
          `"
          :lazy="false"
        />
      </template>

      <template #caption>
        <UiTextLink :is-external="block.link?.linktype === 'url'">
          {{ block.caption }}
        </UiTextLink>
      </template>
    </UiWork>
  </div>
</template>
