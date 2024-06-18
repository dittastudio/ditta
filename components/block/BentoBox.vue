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
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;

  /* This all needs improving. lol */

  &:deep(> :nth-child(1n)) {
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
  }
}
</style>
