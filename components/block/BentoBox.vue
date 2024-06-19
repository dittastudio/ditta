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
    class="w-full px-[var(--app-outer-gutter)]"
    :class="[colourText[block.colour], colourBackground[block.background]]"
  >
    <div class="bento-box grid gap-[var(--app-inner-gutter)] w-full max-w-[var(--app-max-width)] mx-auto py-160">
      <section
        v-for="bento in block.items"
        :key="bento._uid"
        class="rounded-[20px] bg-pink"
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
.bento-box {
  grid-auto-columns: 1fr;
  grid-auto-flow: dense;
  grid-auto-rows: 1fr;
  grid-template-columns: repeat(2, 1fr);

  @screen md {
    grid-template-columns: repeat(4, 1fr);
  }

  /* This all needs improving. lol */

  &:deep(> :nth-child(1n)) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:deep(> :nth-child(1)) {
    grid-column: span 1;
    grid-row: span 2;
    background-color: theme('colors.black/10%');
  }

  &:deep(> :nth-child(2)) {
    grid-column: span 1;
    grid-row: span 1;
    aspect-ratio: 4 / 3;
    background-color: theme('colors.black/20%');
  }

  &:deep(> :nth-child(3)) {
    grid-column: span 1;
    grid-row: span 1;
  background-color: theme('colors.black/30%');

    @screen md {
      grid-column-start: 2;
      grid-row-start: 2;
    }
  }

  &:deep(> :nth-child(4)) {
    grid-column: span 2;
    grid-row: span 2;
    background-color: theme('colors.black/40%');
  }

  &:deep(> :nth-child(5)) {
    grid-column: span 1;
    grid-row: span 2;
    background-color: theme('colors.black/50%');
  }

  &:deep(> :nth-child(6)) {
    grid-column: span 1;
    grid-row: span 2;
    background-color: theme('colors.black/60%');
  }

  &:deep(> :nth-child(7)) {
    grid-column: span 1;
    grid-row: span 1;
    background-color: theme('colors.black/70%');
  }

  &:deep(> :nth-child(8)) {
    grid-column: span 1;
    grid-row: span 1;
    background-color: theme('colors.black/80%');

    @screen md {
      grid-column-start: 3;
      grid-row-start: 4;
    }
  }

  &:deep(> :nth-child(9)) {
    grid-column: span 1;
    grid-row: span 2;
    background-color: theme('colors.black/90%');
  }

  /* &:deep(> :nth-child(1n)) {
    grid-column: auto / span 1;
    grid-row: auto / span 2;
    background-color: red;
  }

  &:deep(> :nth-child(2n)) {
    grid-column: auto / span 1;
    grid-row: auto / span 1;
    background-color: orange;
  }

  &:deep(> :nth-child(7n)) {
    grid-column: auto / span 1;
    grid-row: auto / span 1;
    background-color: palegreen;
  }

  &:deep(> :nth-child(3n)) {
    grid-column: auto / span 2;
    grid-row: auto / span 2;
    background-color: darkblue;
  }

  &:deep(> :nth-child(6n)) {
    grid-column: auto / span 1;
    grid-row: auto / span 2;
    background-color: palevioletred;
  }

  &:deep(> :nth-child(8n)) {
    grid-column: auto / span 1;
    grid-row: auto / span 2;
    background-color: saddlebrown;
  }

  &:deep(> :nth-child(9n)) {
    grid-column: auto / span 1;
    grid-row: auto / span 1;
    background-color: plum;
  } */
}
</style>
