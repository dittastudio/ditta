<script lang="ts" setup>
import type { BlockSteps } from '#storyblok-components'

interface Props {
  block: BlockSteps
}

const { block } = defineProps<Props>()
</script>

<template>
  <div class="wrapper flex flex-col justify-center py-(--app-vertical-rhythm)">
    <UiLockup
      :heading="block.heading || ''"
      :copy="block.copy"
    />
  </div>
</template>
