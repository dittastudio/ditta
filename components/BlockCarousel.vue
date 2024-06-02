<script lang="ts" setup>
export interface Props {
  slides: any[]
}

const { slides } = defineProps<Props>()
</script>

<template>
  <div class="UiCarousel">
    <div class="UiCarousel__scroll scroll-x">
      <div class="UiCarousel__list">
        <div
          v-for="(slide, index) in slides"
          :key="index"
          class="UiCarousel__item w-full md:w-1/2"
        >
          <div class="UiCarousel__block">
            <UiCard>
              <slot :slide="slide" />
            </UiCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.UiCarousel {
  --full: minmax(var(--app-outer-gutter), 1fr);
  --content: min((var(--app-max-width) - var(--app-outer-gutter) * 2), (100% - var(--app-outer-gutter) * 2));

  margin-block: var(--spacing-32);
}

.UiCarousel__scroll {
  overflow-y: hidden;
  display: grid;
  grid-template-columns:
    [full-start] var(--full) [content-start] var(--content) [content-end] var(--full) [full-end];
}

.UiCarousel__list {
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

.UiCarousel__item {
  scroll-snap-align: center;
  flex: 1 0 auto;
  padding-inline: var(--gap);
}

.UiCarousel__block {
  user-select: none;
}
</style>
