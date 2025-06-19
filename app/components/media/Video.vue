<script lang="ts" setup>
import type { UseIntersectionObserverOptions } from '@vueuse/core'
import { useIntersectionObserver } from '@vueuse/core'

interface Source {
  src: string
  type?: string
}

interface Props {
  sources: Source[]
  lazy?: boolean
  io?: UseIntersectionObserverOptions
}

const { sources, lazy = true, io = {} } = defineProps<Props>()

const video = useTemplateRef<HTMLVideoElement | null>('video')
const ready = ref(!lazy)

useIntersectionObserver(
  video,
  ([entry], observerElement) => {
    const { target, isIntersecting } = entry as IntersectionObserverEntry

    if (!(target instanceof HTMLVideoElement)) {
      return
    }

    if (isIntersecting && !ready.value) {
      ready.value = true
      observerElement.disconnect()
    }
  },
  { rootMargin: '0px', threshold: 0, ...io },
)

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs() as { [key: string]: any }
const { class: className, ...rest } = attrs

const videoAttrs = computed(() => ({
  ...rest,
  autoplay: attrs.autoplay === '' && ready.value ? true : undefined,
  preload: ready.value ? 'auto' : 'none',
}))

const getFileExtension = (filename: string = '') => {
  const parts = filename.split('.')
  return parts[parts.length - 1]
}
</script>

<template>
  <link
    v-if="attrs.poster"
    rel="preload"
    :href="attrs.poster"
    as="image"
    fetchpriority="high"
  >

  <video
    ref="video"
    v-bind="videoAttrs"
    :class="[className, { 'is-lazy': lazy }]"
  >
    <source
      v-for="(source, index) in sources"
      :key="index"
      :src="source.src"
      :type="source.type || `video/${getFileExtension(source.src)}`"
    >
  </video>
</template>
