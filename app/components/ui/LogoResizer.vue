<script lang="ts" setup>
import type { StoryblokAsset } from '#storyblok-types'

interface Props {
  asset: StoryblokAsset
  cropHeight?: string
  strength?: number
  baseHeight?: number
  title?: string
}

const { asset, cropHeight = '100', strength = 65, baseHeight = 3.5, title } = defineProps<Props>()

const fileExtension = (filename: string | undefined | null): string => {
  if (!filename) {
    return ''
  }

  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}
</script>

<template>
  <span
    v-if="asset.filename"
    class="logo-resizer"
  >
    <span
      class="logo-resizer__inner"
      :style="{
        '--width': storyblokImageDimensions(asset.filename).width,
        '--height': storyblokImageDimensions(asset.filename).height,
      }"
    >
      <img
        v-if="fileExtension(asset.filename) === 'svg'"
        class="block size-[inherit] object-contain"
        :src="asset.filename"
        :alt="title || asset.alt || asset.title || 'Logo'"
        :width="storyblokImageDimensions(asset.filename).width"
        :height="storyblokImageDimensions(asset.filename).height"
        loading="lazy"
      />

      <NuxtImg
        v-else
        class="block size-[inherit] object-contain"
        :src="asset.filename"
        :alt="title || asset.alt || asset.title || 'Logo'"
        :width="
          Math.round(
            (storyblokImageDimensions(asset.filename).width / storyblokImageDimensions(asset.filename).height) *
              Number(cropHeight),
          )
        "
        :height="cropHeight"
        densities="x1 x2"
        :modifiers="{
          smart: false,
        }"
        loading="lazy"
      />
    </span>
  </span>
</template>

<style>
@reference "@/assets/css/app.css";

/* Reference: https://9elements.com/blog/building-the-perfect-logo-strip/ */
@property --captured-length {
  syntax: '<length>';
  initial-value: 0px;
  inherits: false;
}

.logo-resizer {
  --strength: calc(v-bind(strength) / 100);
  --base-height: calc(v-bind(baseHeight) * 16px);
  --logo-min-size-factor: 0.375;
  --logo-max-size-factor: 1.25;

  @variant md {
    --base-height: calc((v-bind(baseHeight) * 16px) * 1.25);
  }
}

.logo-resizer__inner {
  --captured-length: var(--base-height);
  --area: pow(tan(atan2(var(--captured-length), 1px)), 2);
  --diff: sqrt(var(--area) / (var(--width) * var(--height)));

  --scaled-height: calc(1px * var(--height) * var(--diff));

  height: clamp(
    var(--base-height) * var(--logo-min-size-factor),
    var(--base-height) + (var(--scaled-height) - var(--base-height)) * var(--strength),
    var(--base-height) * var(--logo-max-size-factor)
  );
}
</style>
