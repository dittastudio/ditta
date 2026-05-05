<script lang="ts" setup>
import type { BlockMedia } from '#storyblok-components'

interface Props {
  block: BlockMedia
}

const { block } = defineProps<Props>()

// const media = computed(() => block.media?.[0])

const setSizes = computed(() => {
  switch (block.placement) {
    case 'inset':
      return `
        xs:100vw
        sm:100vw
        md:80vw
        lg:80vw
        xl:1147px
      `
    case 'wide':
      return `
        xs:100vw
        sm:100vw
        md:100vw
        lg:100vw
        xl:1380px
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
})
</script>

<template>
  <div
    v-editable="block"
    :class="{
      'wrapper grid gap-x-(--app-gutter-inner) grid-cols-12': block.placement !== 'full',
      'pt-(--app-gutter-inner)': block.spacing_top_media && block.spacing_top,
      'pt-(--app-vertical-rhythm)': block.spacing_top && !block.spacing_top_media,
      'pb-(--app-gutter-inner)': block.spacing_bottom_media && block.spacing_bottom,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom && !block.spacing_bottom_media,
    }"
  >
    <div
      class="flex flex-col md:flex-row gap-(--app-gutter-inner)"
      :class="{
        'col-span-full': block.placement === 'wide',
        'col-span-full md:col-start-2 md:col-span-10': block.placement === 'inset',
        'pt-(--app-vertical-spacing)': block.placement === 'full',
      }"
    >
      <div
        class="basis-1/2 grow"
        v-for="media in block.media"
        :key="media._uid"
      >
        <NuxtImg
          v-if="media && media.image?.filename && storyblokAssetType(media.image.filename) === 'image'"
          class="block"
          :src="media.image.filename"
          :alt="media.image.alt || ''"
          :width="storyblokImageDimensions(media.image.filename).width"
          :height="storyblokImageDimensions(media.image.filename).height"
          :sizes="setSizes"
          loading="lazy"
        />
      </div>
    </div>
  </div>
</template>
