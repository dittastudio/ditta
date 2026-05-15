<script lang="ts" setup>
interface Props {
  src: string
  media?: string | undefined
  width: number
  height: number
  sizes?: string
  focus?: string | null
}

const { src, media, width, height, sizes, focus } = defineProps<Props>()

const cSizes = computed(() => {
  const img = useImage()

  return img.getSizes(src, {
    provider: 'storyblok',
    sizes: sizes || 'xs:100vw sm:100vw md:100vw lg:100vw xl:100vw',
    modifiers: {
      width,
      height,
      smart: true,
      filters: {
        format: 'webp',
        ...(focus ? { focal: focus } : {}),
      },
    },
  })
})
</script>

<template>
  <source
    :media="media"
    :srcset="cSizes.srcset"
    :sizes="cSizes.sizes"
  />
</template>
