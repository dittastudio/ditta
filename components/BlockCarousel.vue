<script lang="ts" setup>
export interface Props {
  slides: any[]
}

const { slides } = defineProps<Props>()

const carousel = ref<HTMLDivElement | null>(null)
const list = ref<HTMLDivElement | null>(null)
const items = ref<any | null>(null)
const currentIndex = ref(0)

const changeSlide = (direction: 'prev' | 'next') => {
  if (!carousel.value || !list.value)
    return

  const maxItems = slides.length

  if (direction === 'prev') {
    currentIndex.value -= 1
  }
  else {
    currentIndex.value += 1
  }

  if (currentIndex.value >= maxItems) {
    currentIndex.value = 0
  }

  if (currentIndex.value < 0) {
    currentIndex.value = maxItems - 1
  }

  items.value[currentIndex.value].scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  })
}
</script>

<template>
  <div class="block-carousel section">
    <div
      ref="carousel"
      class="block-carousel__scroll scroll-x"
    >
      <div
        ref="list"
        class="block-carousel__list"
      >
        <div
          v-for="(slide, index) in slides"
          :key="index"
          ref="items"
          class="block-carousel__item w-full md:w-1/2"
        >
          <div class="block-carousel__block">
            <UiCard>
              <slot :slide="slide" />
            </UiCard>
          </div>
        </div>
      </div>
    </div>

    <button
      class="block-carousel__button block-carousel__button--prev"
      @click="changeSlide('prev')"
    >
      Previous
    </button>

    <button
      class="block-carousel__button block-carousel__button--next"
      @click="changeSlide('next')"
    >
      Next
    </button>
  </div>
</template>

<style lang="postcss">
.block-carousel {
  --full: minmax(var(--app-outer-gutter), 1fr);
  --content: min((var(--app-max-width) - var(--app-outer-gutter) * 2), (100% - var(--app-outer-gutter) * 2));
}

.block-carousel__scroll {
  overflow-y: hidden;
  display: grid;
  grid-template-columns:
    [full-start] var(--full) [content-start] var(--content) [content-end] var(--full) [full-end];
}

.block-carousel__list {
  --gap: calc(var(--app-outer-gutter) / 4);

  display: flex;
  grid-column: content;
  margin-inline: calc(var(--gap) * -1);
  padding-block: var(--spacing-32);

  &::after {
    content: '';
    align-self: stretch;
    padding-inline-end: max((var(--app-outer-gutter) - var(--gap)), ((100vw - var(--app-max-width))/2) + calc(var(--gap) * 3));
  }
}

.block-carousel__item {
  scroll-snap-align: center;
  flex: 1 0 auto;
  padding-inline: var(--gap);
}

.block-carousel__block {
  user-select: none;
}
</style>
