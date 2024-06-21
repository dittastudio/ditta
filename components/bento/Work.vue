<script lang="ts" setup>
import type { SwiperOptions } from 'swiper/types'
import { useIntersectionObserver } from '@vueuse/core'
import type { BentoWorkStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoWorkStoryblok
}

const { block } = defineProps<Props>()

const isVisible = ref(false)
const container = ref<HTMLDivElement | null>(null)

useIntersectionObserver(
  container,
  ([{ isIntersecting }]) => {
    isVisible.value = isIntersecting
  },
  { rootMargin: '0px 0px 0px 0px', threshold: 0.25 },
)

const swiperOptions = computed<SwiperOptions>(() => ({
  effect: 'fade',
  loop: true,
  autoplay: isVisible.value ? { delay: 3000, pauseOnMouseEnter: true } : false,
  keyboard: {
    enabled: true,
  },
}))
</script>

<template>
  <div
    ref="container"
    v-editable="block"
    class="bg-purple w-full h-full"
  >
    <UiSlider
      :slides="block.slides"
      :options="swiperOptions"
    >
      <template #slide="{ slide }">
        <img
          class="object-cover w-full h-full"
          :src="slide.filename"
          alt="lol"
        >
      </template>
    </UiSlider>
    <!-- <pre>{{ block.component }}</pre> -->
  </div>
</template>
