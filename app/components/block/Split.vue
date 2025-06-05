<script lang="ts" setup>
import type { BlockSplitStoryblok } from '@@/types/storyblok'

interface Props {
  block: BlockSplitStoryblok
}

const { block } = defineProps<Props>()
const assetType = computed(() => storyblokAssetType(block.image?.filename || ''))
</script>

<template>
  <div
    v-editable="block"
    class="block-split wrapper max-w-[var(--breakpoint-2xl)] py-[var(--app-outer-gutter)] min-h-svh flex flex-col justify-center"
  >
    <div class="grid grid-cols-1 md:grid-cols-12 gap-x-[var(--app-inner-gutter)] gap-y-[var(--app-outer-gutter)] items-end justify-center">
      <div class="col-span-full md:col-span-5">
        <div class="overflow-hidden rounded-sm">
          <MediaImageResponsive
            v-if="block.image && assetType === 'image'"
            :asset="block.image"
            :desktop-asset="block.image"
            :ratio="block.ratio"
            :desktop-ratio="block.ratio_desktop"
            sizes="
          2xs:100vw
          xs:100vw
          sm:100vw
          md:100vw
        "
            desktop-sizes="
          md:50vw
          lg:50vw
          xl:50vw
          2xl:50vw
        "
          />
        </div>
      </div>

      <div class="col-span-full md:col-span-7 md:flex items-end justify-end">
        <div
          v-if="storyblokRichTextContent(block.text)"
          class="prose max-w-[26ch] type-fluid-sm"
        >
          <StoryblokText :html="block.text" />
        </div>
      </div>
    </div>
  </div>
</template>
