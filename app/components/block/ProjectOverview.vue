<script lang="ts" setup>
import type { BlockProjectOverview } from '#storyblok-components'

interface Props {
  block: BlockProjectOverview
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    class="wrapper"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <UiLockup
      :heading="block.heading"
      :copy="block.copy"
    >
      <slot />
    </UiLockup>
  </div>
</template>
