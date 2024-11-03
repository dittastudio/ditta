<script lang="ts" setup>
import Swiper from 'swiper'
import type { SwiperOptions } from 'swiper/types'
import { Autoplay, EffectFade, Keyboard, Pagination } from 'swiper/modules'

interface Props {
  slides: any
  pagination?: boolean
  options?: SwiperOptions
}

const { slides, pagination = true, options } = defineProps<Props>()

const swiper = ref<Swiper>()
const swiperEl = ref<HTMLDivElement | null>(null)
const paginationEl = ref<HTMLDivElement | null>(null)
const bulletTotal = 5
const bulletsVisible = 2

const updatePagination = (swiper: Swiper) => {
  const bulletSize = 16

  let position = 0

  if (swiper.realIndex < (slides.length - bulletsVisible)) {
    position = swiper.realIndex < (bulletsVisible + 1) ? 0 : -Math.abs(bulletSize * (swiper.realIndex - bulletsVisible))
  }
  else {
    position = -Math.abs(bulletSize * (slides.length - bulletTotal))
  }

  paginationEl.value?.style.setProperty('--bullet-movement', `${position}px`)

  const bullets = paginationEl.value?.querySelectorAll('.ui-carousel__bullet') as NodeListOf<HTMLButtonElement>

  bullets.forEach((bullet, index) => {
    if ((swiper.realIndex < 2 && index < 5)
      || (swiper.realIndex > bullets.length - 3 && index >= bullets.length - 5)
      || (index >= swiper.realIndex - 2 && index <= swiper.realIndex + 2)) {
      bullet.classList.remove('ui-carousel__bullet--is-hidden')
    }
    else {
      bullet.classList.add('ui-carousel__bullet--is-hidden')
    }
  })
}

const initSwiper = () => {
  if (!swiperEl.value) {
    return
  }

  swiper.value = new Swiper(swiperEl.value, {
    modules: [Autoplay, EffectFade, Keyboard, Pagination],
    enabled: slides && slides.length > 1,
    speed: 500,
    pagination: pagination
      ? {
          el: paginationEl.value,
          clickable: true,
          bulletClass: 'ui-carousel__bullet',
          bulletActiveClass: 'ui-carousel__bullet--is-active',
          renderBullet(index, className) {
            return `
              <button type="button" class="${className}">
                <span class="ui-carousel__dot block bg-current rounded-full">
                  <span class="sr-only">Slide ${index + 1}</span>
                </span>
              </button>
            `
          },
        }
      : false,
    on: {
      init: (slider) => {
        if (slides.length > bulletTotal)
          updatePagination(slider)
      },
      slideChange: (slider) => {
        if (slides.length > bulletTotal)
          updatePagination(slider)
      },
    },
    ...options,
  })
}

onMounted(async () => {
  await nextTick()

  initSwiper()
})

onUnmounted(() => swiper.value?.destroy())

watch(() => slides, () => {
  swiper.value?.update()
  swiper.value?.updateSlides()
})

watch(() => options, () => {
  if (!swiper.value)
    return

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
    class="swiper select-none relative h-[inherit]"
  >
    <div class="swiper-wrapper size-full hover:cursor-grab active:cursor-grabbing flex transition-transform ease-out">
      <div
        v-for="(slide, index) in slides"
        :key="index"
        class="swiper-slide touch-pan-y touch-pinch-zoom shrink-0 size-full transition-transform"
      >
        <slot
          name="slide"
          :slide="slide"
        />
      </div>
    </div>

    <div class="bg-gradient-to-t from-black/50 to-black/0 pt-80 absolute inset-x-0 bottom-0 pointer-events-none">
      <div
        v-if="pagination && slides?.length > 1"
        class="ui-carousel__pagination-wrapper z-1 text-white pointer-events-auto"
      >
        <div
          ref="paginationEl"
          class="swiper-pagination flex translate-x-[var(--bullet-movement)] transition-transform duration-500 ease-smooth will-change-transform"
          :class="{ 'justify-center': pagination && slides?.length < 5 }"
        />
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.ui-carousel__pagination-wrapper {
  --dot-size: 8px;

  width: calc(var(--dot-size) * 11);
  margin-inline: auto;
  padding-inline: calc(var(--dot-size) / 2);
}

.ui-carousel__bullet {
  padding: theme('spacing.20') calc(var(--dot-size) / 2);
  opacity: 0.2;
  transition:
    opacity theme('transitionDuration.500') theme('transitionTimingFunction.smooth'),
    scale theme('transitionDuration.500') theme('transitionTimingFunction.smooth');

  &--is-hidden {
    scale: 0.5;
    opacity: 0;
  }

  &--is-active {
    scale: 1;
    opacity: 1;
  }
}

.ui-carousel__dot {
  width: var(--dot-size);
  height: var(--dot-size);

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
