<script lang="ts" setup>
import type { StoryblokAsset } from '@@/.storyblok/types/storyblok'
import { useIntersectionObserver } from '@vueuse/core'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs() as { [key: string]: any }

interface Props {
  asset: StoryblokAsset
  desktopAsset?: StoryblokAsset
  breakpoint?: 'landscape' | 'portrait' | number
  ratio?: string | number
  desktopRatio?: string | number
  sizes: string
  desktopSizes?: string
  alt?: string
  lazy?: boolean
}

const {
  asset,
  desktopAsset,
  breakpoint = 800,
  ratio,
  desktopRatio,
  sizes,
  desktopSizes,
  lazy = true,
} = defineProps<Props>()

const container = useTemplateRef<HTMLPictureElement | null>('container')
const ready = ref(!lazy)
const loaded = ref(!lazy)

useIntersectionObserver(
  container,
  ([entry], observerElement) => {
    const { isIntersecting } = entry as IntersectionObserverEntry

    if (isIntersecting && !ready.value) {
      ready.value = true
      observerElement.disconnect()
    }
  },
  { rootMargin: '0px 0px 0px 0px', threshold: 0.25 },
)

const imgMain = useImage()

// Function to get image size based on asset and ratio
function getImageSize(imageAsset: StoryblokAsset, imageRatio?: string | number) {
  const { width, height } = storyblokImageDimensions(imageAsset.filename)

  // Use provided ratio if valid, otherwise calculate from image dimensions
  const isRatioValid = imageRatio && validAspectRatio(imageRatio)
  const aspectRatio = isRatioValid
    ? calculateAspectRatio(ratioDimensions(imageRatio).width, ratioDimensions(imageRatio).height)
    : calculateAspectRatio(width, height)

  return {
    width: ratioDimensions(aspectRatio).width,
    height: ratioDimensions(aspectRatio).height,
  }
}

// Function to create image info (srcset, sizes, etc.)
function createImageInfo(imageAsset: StoryblokAsset, imageSize: { width: number, height: number }, imageSizes: string) {
  return imgMain.getSizes(storyblokImageUrlUpdate(imageAsset.filename || ''), {
    provider: 'storyblok',
    sizes: imageSizes,
    modifiers: {
      width: imageSize.width,
      height: imageSize.height,
      quality: 80,
      filters: {
        focal: imageAsset.focus ?? undefined,
      },
    },
  })
}

// Function to create placeholder image
function createPlaceholder(imageAsset: StoryblokAsset, imageSize: { width: number, height: number }) {
  return storyblokImage(
    imageAsset.filename,
    {
      width: imageSize.width,
      height: imageSize.height,
      quality: 10,
      focal: imageAsset.focus ?? undefined,
    },
  )
}

// Mobile image size and info
const mobileSize = getImageSize(asset, ratio)
const imgInfo = computed(() => createImageInfo(asset, mobileSize, sizes))
const mobilePlaceholder = createPlaceholder(asset, mobileSize)

// Desktop image size and info (if available)
const hasDesktopImage = computed(() => !!desktopRatio)
const desktopSize = computed(() => hasDesktopImage.value ? getImageSize(desktopAsset || asset, desktopRatio) : mobileSize)
const desktopImgInfo = computed(() => hasDesktopImage.value ? createImageInfo(desktopAsset || asset, desktopSize.value, desktopSizes || sizes) : null)
const desktopPlaceholder = computed(() => hasDesktopImage.value ? createPlaceholder(desktopAsset || asset, desktopSize.value) : null)

const { class: className, ...rest } = attrs

// Attributes for the mobile image
const imgAttrs = computed(() => ({
  ...rest,
  width: mobileSize.width,
  height: mobileSize.height,
  src: ready.value ? storyblokImageUrlUpdate(asset.filename || '') : '',
  sizes: ready.value ? imgInfo.value.sizes : '',
  srcset: ready.value ? imgInfo.value.srcset : '',
  alt: attrs.alt ?? asset.alt ?? '',
  loading: lazy ? 'lazy' as const : 'eager' as const,
}))

const breakpointMedia = computed(() => {
  if (typeof breakpoint === 'string') {
    return breakpoint === 'landscape' ? '(orientation: landscape)' : '(orientation: portrait)'
  }

  return `(min-width: ${breakpoint}px)`
})
</script>

<template>
  <div
    class="media-image relative isolate overflow-hidden w-full h-[inherit]"
    :class="[className, { 'is-loaded': loaded, 'is-lazy': lazy }]"
  >
    <picture
      ref="container"
      class="h-[inherit]"
    >
      <!-- Desktop image source if provided -->
      <source
        v-if="hasDesktopImage"
        :media="breakpointMedia"
        :srcset="desktopImgInfo?.srcset"
        :sizes="desktopImgInfo?.sizes || imgInfo.sizes"
        :width="desktopSize.width"
        :height="desktopSize.height"
      >

      <!-- Mobile/default image -->
      <img
        v-bind="imgAttrs"
        class="media-image__file w-full h-[inherit] object-cover"
        @load="loaded = true"
      >
    </picture>

    <picture
      v-if="lazy"
      class="media-image__placeholder block w-full h-[inherit] pointer-events-none"
    >
      <!-- Desktop placeholder source if provided -->
      <source
        v-if="hasDesktopImage && desktopPlaceholder"
        :media="breakpointMedia"
        :srcset="desktopPlaceholder"
        :width="desktopSize.width"
        :height="desktopSize.height"
      >

      <!-- Mobile/default placeholder -->
      <img
        class="block w-full object-cover h-[inherit]"
        :src="mobilePlaceholder"
        :width="mobileSize.width"
        :height="mobileSize.height"
        alt=""
        loading="lazy"
      >
    </picture>
  </div>
</template>

<style lang="postcss" scoped>
.media-image {
  --media-image-fade-duration: 1s;
}

.media-image__file {
  .media-image.is-lazy & {
    position: absolute;
    z-index: 1;
    inset: 0;
    backface-visibility: hidden;
    opacity: 0;
    transition: opacity var(--media-image-fade-duration) var(--ease-out);
  }

  .media-image.is-loaded & {
    opacity: 1;
  }
}

.media-image__placeholder {
  position: relative;
  backface-visibility: hidden;
  opacity: 1;
  transition: opacity calc(var(--media-image-fade-duration) * 2) var(--ease-out) calc(var(--media-image-fade-duration) / 2);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    backdrop-filter: blur(8px);
  }

  .media-image.is-loaded & {
    opacity: 0;
  }
}
</style>
