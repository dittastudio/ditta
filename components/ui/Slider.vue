<script lang="ts" setup>
import Swiper from 'swiper'
import type { SwiperOptions } from 'swiper/types'
import { Autoplay, EffectFade, Keyboard, Pagination } from 'swiper/modules'
import { wait } from '@/utilities/helpers'

interface Props {
  slides: any
  pagination?: boolean
  options?: SwiperOptions
}

const { slides, pagination = true, options } = defineProps<Props>()

const swiper = ref<Swiper>()
const swiperEl = ref<HTMLDivElement | null>(null)
const paginationEl = ref<HTMLDivElement | null>(null)
const currentSlidesPerView = 1

const updatePagination = (swiper: Swiper) => {
  if (swiper.realIndex < (slides.length - (currentSlidesPerView + 1))) {
    const bulletSize = 16
    const position = swiper.realIndex < 3 ? 0 : -Math.abs(bulletSize * (swiper.realIndex - 2))

    paginationEl.value?.style.setProperty('--bullet-movement', `${position}px`)
  }
}

const initSwiper = () => {
  if (!swiperEl.value) {
    return
  }

  swiper.value = new Swiper(swiperEl.value, {
    modules: [Autoplay, EffectFade, Pagination, Keyboard],
    enabled: slides && slides.length > 1,
    speed: 500,
    pagination: pagination
      ? {
          el: paginationEl.value,
          clickable: true,
          bulletClass: 'ui-carousel__bullet',
          bulletActiveClass: 'ui-carousel__bullet--is-active',
          renderBullet(_, className) {
            return `
              <button type="button" class="${className}">
                <span class="ui-carousel__dot"></span>
              </button>
            `
          },
        }
      : false,
    on: {
      init: (slider) => {
        updatePagination(slider)
      },
      slideChange: (slider) => {
        updatePagination(slider)
      },
    },
    ...options,
  })
}

onMounted(async () => {
  await wait(1000)

  initSwiper()
})

onUnmounted(() => swiper.value?.destroy())

watch(() => slides, () => {
  swiper.value?.update()
  swiper.value?.updateSlides()
})

watch(() => options, () => {
  if (!swiper.value) {
    return
  }

  if (typeof options?.autoplay === 'boolean' && !options?.autoplay) {
    swiper.value.autoplay.pause()
  }
  else if (typeof options?.autoplay === 'object') {
    swiper.value.autoplay.start()
  }
})
</script>

<template>
  <div
    ref="swiperEl"
    class="ui-carousel swiper"
  >
    <div class="ui-carousel__wrapper swiper-wrapper">
      <div
        v-for="(slide, index) in slides"
        :key="index"
        class="ui-carousel__slide swiper-slide"
        @click="swiper?.slideNext()"
      >
        <slot
          name="slide"
          :slide="slide"
        />
      </div>
    </div>

    <div
      v-if="pagination && slides?.length > 1"
      class="ui-carousel__pagination-wrapper"
    >
      <div
        ref="paginationEl"
        class="ui-carousel__pagination swiper-pagination"
        :class="{ 'justify-center': pagination && slides?.length < 5 }"
      />
    </div>
  </div>
</template>

<style lang="postcss">
.ui-carousel {
  user-select: none;
  position: relative;
  height: inherit;
}

.ui-carousel__wrapper {
  display: flex;

  width: 100%;
  height: 100%;

  transition-timing-function: theme('transitionTimingFunction.out');
  transition-property: transform;
}

.ui-carousel__slide {
  touch-action: pan-y pinch-zoom;

  flex-shrink: 0;

  width: 100%;
  height: 100%;

  transition-property: transform;
}

.ui-carousel__pagination-wrapper {
  --dot-size: 8px;

  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 0;
  left: 0;

  overflow: hidden;

  width: calc(var(--dot-size) * 11);

  /* margin-block-start: calc(30px - var(--dot-size)); */
  margin-inline: auto;
  padding-inline: 4px;

  color: theme('colors.white');

  /* &::before,
  &::after {
    pointer-events: none;
    content: '';

    position: absolute;
    z-index: 1;
    top: 0;

    width: var(--dot-size);
    height: 100%;
  }

  &::before {
    left: 0;
    background-image: linear-gradient(to left, transparent, var(--app-background-color));
  }

  &::after {
    right: 0;
    background-image: linear-gradient(to right, transparent, var(--app-background-color));
  } */
}

.ui-carousel__pagination {
  will-change: transform;
  transform: translateX(var(--bullet-movement)) translateZ(0);
  display: flex;
  transition: transform theme('transitionDuration.500') theme('transitionTimingFunction.out');
}

.ui-carousel__bullet {
  padding: theme('spacing.20') calc(var(--dot-size) / 2);
}

.ui-carousel__dot {
  cursor: pointer;

  display: block;

  width: var(--dot-size);
  height: var(--dot-size);

  opacity: 0.2;
  background-color: currentcolor;
  border-radius: 50%;

  transition: opacity theme('transitionDuration.200') theme('transitionTimingFunction.smooth');

  .ui-carousel__bullet--is-active & {
    opacity: 1;
  }
}

.swiper-android .swiper-slide,
.swiper-ios .swiper-slide,
.swiper-wrapper {
  transform: translate3d(0, 0, 0);
}

.swiper-fade .swiper-slide {
  pointer-events: none;
  transition-property: opacity;
}

.swiper-fade .swiper-slide-active {
  pointer-events: auto;
}
</style>
