<script lang="ts" setup>
import type { BlockClients } from '#storyblok-components'

interface Props {
  block: BlockClients
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="flex flex-col gap-10 md:gap-18 items-center text-center"
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

    <div class="clients__ticker relative overflow-hidden w-full">
      <UiTicker
        v-if="block.logos?.length"
        spacing-classes="gap-12 px-6"
        direction="right"
        :speed="0.5"
      >
        <UiLogoResizer
          class="opacity-40"
          v-for="logo in block.logos"
          :key="logo.id"
          :asset="logo"
          :strength="80"
          :base-height="2"
        />
      </UiTicker>
    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.clients__ticker {
  mask-image: linear-gradient(to left, transparent 5%, black 20%, black 80%, transparent 95%);
}
</style>
