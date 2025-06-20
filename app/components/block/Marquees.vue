<script lang="ts" setup>
import type { BlockMarquees } from '@@/.storyblok/types/284609/storyblok-components'

interface Props {
  block: BlockMarquees
}

const { block } = defineProps<Props>()

const items = computed(() => block.items)
</script>

<template>
  <div
    class="block-marquee"
  >
    <UiTicker
      v-for="(item, index) in items"
      :key="index"
      :copy="[`${item.copy}`]"
      :duration="`${item.duration}s`"
      :direction="index % 2 ? 'right' : 'left'"
    />
  </div>
</template>
