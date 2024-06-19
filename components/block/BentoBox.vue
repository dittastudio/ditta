<script lang="ts" setup>
import type { BlockBentoBoxStoryblok } from '@/types/storyblok'
import { colourBackground, colourText } from '@/utilities/maps'

interface Props {
  block: BlockBentoBoxStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="bento-box"
    :class="[colourText[block.colour], colourBackground[block.background]]"
  >
    <div class="bento-box__grid section wrapper gap-16 lg:gap-20 grid">
      <section
        v-for="bento in block.items"
        :key="bento._uid"
        class="rounded-[20px]"
      >
        <BentoGame
          v-if="bento.component === 'bento_game'"
          :block="bento"
        />

        <BentoInstagram
          v-else-if="bento.component === 'bento_instagram'"
          :block="bento"
        />

        <BentoMusic
          v-else-if="bento.component === 'bento_music'"
          :block="bento"
        />

        <BentoNotice
          v-else-if="bento.component === 'bento_notice'"
          :block="bento"
        />

        <BentoQr
          v-else-if="bento.component === 'bento_qr'"
          :block="bento"
        />

        <BentoShopify
          v-else-if="bento.component === 'bento_shopify'"
          :block="bento"
        />

        <BentoTeam
          v-else-if="bento.component === 'bento_team'"
          :block="bento"
        />

        <BentoWeather
          v-else-if="bento.component === 'bento_weather'"
          :block="bento"
        />

        <BentoWork
          v-else-if="bento.component === 'bento_work'"
          :block="bento"
        />
      </section>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.bento-box__grid {
  display: grid;
  grid-auto-flow: dense;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--app-inner-gutter);

  @screen sm {
    grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  }

  @screen 2xl {
    grid-template-columns: repeat(4, 1fr);
  }

  /* For debugging purposes */
  /*
  &:deep(> *) {
    background-color: theme('colors.black/30%');
  }
  */

  /* This all needs improving. lol */

  &:deep(> :nth-child(1n)) {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  &:deep(> :nth-child(1)) {
    grid-row: span 2;
    order: 1;
    aspect-ratio: 4 / 6;
  }

  &:deep(> :nth-child(2)) {
    order: 2;
    aspect-ratio: 4 / 3;
  }

  &:deep(> :nth-child(3)) {
    order: 5;
    aspect-ratio: 4 / 3;
  }

  &:deep(> :nth-child(4)) {
    grid-row: span 2;
    order: 4;
    aspect-ratio: 4 / 3;

    @screen sm {
      grid-column: span 2;
    }
  }

  &:deep(> :nth-child(5)) {
    grid-row: span 2;
    order: 5;
    aspect-ratio: 4 / 6;
  }

  &:deep(> :nth-child(6)) {
    grid-row: span 2;
    order: 6;
    aspect-ratio: 4 / 6;
  }

  &:deep(> :nth-child(7)) {
    grid-column: span 1;
    grid-row: span 1;
    order: 7;
    aspect-ratio: 4 / 3;
  }

  &:deep(> :nth-child(8)) {
    grid-column: span 1;
    grid-row: span 1;
    order: 10;
    aspect-ratio: 4 / 3;
  }

  &:deep(> :nth-child(9)) {
    grid-column: span 1;
    grid-row: span 2;
    order: 9;
    aspect-ratio: 4 / 6;
  }
}
</style>
