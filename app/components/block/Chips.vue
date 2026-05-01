<script lang="ts" setup>
import type { BlockChips } from '#storyblok-components'

interface Props {
  block: BlockChips
}

const { block } = defineProps<Props>()
</script>

<template>
  <div class="wrapper flex flex-col justify-center">
    <UiLockup
      :heading="block.heading"
      :copy="block.copy"
    />
  </div>
</template>
