<script lang="ts" setup>
import type { BlockCompanies, ElementTicker } from '#storyblok-components'

interface Props {
  block: BlockCompanies
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="flex flex-col gap-16 md:gap-24 items-center text-center"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div class="wrapper w-full">
      <p
        v-if="block.heading"
        class="text-heading max-w-[24ch] text-pretty mx-auto"
      >
        {{ block.heading }}
      </p>
    </div>

    <div class="companies__tickers relative overflow-hidden w-full flex flex-col gap-10 md:gap-15">
      <template
        v-for="(ticker, index) in block.blocks as ElementTicker[]"
        :key="ticker._uid"
      >
        <UiTicker
          v-if="ticker.items?.length"
          spacing-classes="gap-10 px-5 md:gap-20 md:px-10"
          :direction="index % 2 === 0 ? 'left' : 'right'"
          :speed="0.1"
        >
          <UiLogoResizer
            v-for="logo in ticker.items"
            :key="logo.id"
            :asset="logo"
            :strength="70"
            :base-height="2.25"
            class="opacity-30"
          />
        </UiTicker>
      </template>
    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.companies__tickers {
  /* mask-image: linear-gradient(to left, transparent 5%, black 20%, black 80%, transparent 95%); */
}
</style>
