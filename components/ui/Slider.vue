<script lang="ts" setup>
import Swiper from 'swiper'
import type { SwiperOptions } from 'swiper/types'
import { Autoplay, EffectFade, Keyboard, Navigation, Pagination } from 'swiper/modules'

interface Props {
  slides: any
  pagination?: boolean
  options?: SwiperOptions
}

const { slides, pagination = true, options } = defineProps<Props>()

const swiper = ref<Swiper>()
const swiperEl = ref<HTMLDivElement | null>(null)
const prev = ref<HTMLButtonElement | null>(null)
const next = ref<HTMLButtonElement | null>(null)
const paginationEl = ref<HTMLDivElement | null>(null)
const currentSlidesPerView = 1

const updatePagination = (swiper: Swiper) => {
  if (swiper.realIndex < (slides.length - (currentSlidesPerView + 1))) {
    const bulletSize = 16
    const position = swiper.realIndex < 3 ? 0 : -Math.abs(bulletSize * (swiper.realIndex - 2))

    paginationEl.value?.style.setProperty('--bullet-movement', `${position}px`)

    const bullets = paginationEl.value?.querySelectorAll('.ui-carousel__bullet') as NodeListOf<HTMLButtonElement>

    bullets.forEach((bullet, index) => {
      if (index >= swiper.realIndex - 2 && index <= swiper.realIndex + 2) {
        bullet.classList.remove('ui-carousel__bullet--is-hidden')
      }
      else {
        bullet.classList.add('ui-carousel__bullet--is-hidden')
      }
    })
  }
}

const initSwiper = () => {
  if (!swiperEl.value) {
    return
  }

  swiper.value = new Swiper(swiperEl.value, {
    modules: [Autoplay, EffectFade, Keyboard, Navigation, Pagination],
    enabled: slides && slides.length > 1,
    speed: 500,
    navigation: {
      hideOnClick: true,
      nextEl: next.value,
      prevEl: prev.value,
    },
    pagination: pagination
      ? {
          el: paginationEl.value,
          clickable: true,
          bulletClass: 'ui-carousel__bullet',
          bulletActiveClass: 'ui-carousel__bullet--is-active',
          renderBullet(_, className) {
            return `
              <button type="button" class="${className}">
                <span class="ui-carousel__dot block bg-current rounded-full"></span>
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
  await nextTick()

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
    class="swiper select-none relative h-[inherit]"
  >
    <div class="swiper-wrapper size-full flex transition-transform ease-out">
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

    <button
      ref="prev"
      class="hover:cursor-w-resize absolute inset-y-0 left-0 w-1/2"
      type="button"
    >
      <span class="sr-only">Prev</span>
    </button>

    <button
      ref="next"
      class="hover:cursor-e-resize absolute inset-y-0 right-0 w-1/2"
      type="button"
    >
      <span class="sr-only">Next</span>
    </button>

    <div
      v-if="pagination && slides?.length > 1"
      class="ui-carousel__pagination-wrapper xoverflow-hidden z-1 absolute inset-x-0 bottom-0 text-white bg-black"
    >
      <div
        ref="paginationEl"
        class="swiper-pagination flex translate-x-[var(--bullet-movement)] transition-transform duration-500 ease-smooth will-change-transform"
        :class="{ 'justify-center': pagination && slides?.length < 5 }"
      />
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
  transition: opacity theme('transitionDuration.500') theme('transitionTimingFunction.smooth');

  &--is-hidden {
    opacity: 0;
  }

  &--is-active {
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
