<script lang="ts" setup>
import type { BlockMedia } from '#storyblok-components'

interface Props {
  block: BlockMedia
}

const { block } = defineProps<Props>()

function getSizes(layout: string | undefined) {
  switch (layout) {
    case 'half':
      return `
        xs:100vw
        sm:100vw
        md:50vw
        lg:50vw
        xl:700px
      `
    case 'wide':
      return `
        xs:100vw
        sm:100vw
        md:100vw
        lg:100vw
        xl:1420px
      `
    default:
      return `
        xs:100vw
        sm:100vw
        md:100vw
        lg:100vw
        xl:100vw
      `
  }
}
</script>

<template>
  <div
    v-editable="block"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
    class="overflow-clip"
  >
    <div class="wrapper grid grid-cols-1 md:grid-cols-2 gap-(--app-gutter-inner) grid-flow-dense">
      <div
        v-for="media in block.media"
        :key="media._uid"
        :class="{
          'col-span-full': media.layout === 'full' || media.layout === 'wide',
          'col-span-1': media.layout === 'half',
          'w-dvw mx-[calc(50%-50dvw)] max-w-none': media.layout === 'full',
        }"
      >
        <NuxtImg
          v-if="media.image && media.image.filename && storyblokAssetType(media.image.filename) === 'image'"
          class="block w-full"
          :class="{
            'rounded-[2px]': media.layout !== 'full',
          }"
          :src="media.image.filename"
          :alt="media.image.alt || ''"
          :width="storyblokImageDimensions(media.image.filename).width"
          :height="storyblokImageDimensions(media.image.filename).height"
          :sizes="getSizes(media.layout)"
          loading="lazy"
        />
      </div>
    </div>
  </div>
</template>
