<script lang="ts" setup>
import type { BlockProjects } from '#storyblok-components'

interface Props {
  block: BlockProjects
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    class=""
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div
      v-if="block.ticker"
      class="w-full"
    >
      <UiTicker>
        <div
          v-for="i in 4"
          class="text-display"
        >
          {{ block.ticker }}
        </div>
      </UiTicker>
    </div>
  </div>
</template>
