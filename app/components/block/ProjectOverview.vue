<script lang="ts" setup>
import type { Block } from '#storyblok-schema'

interface Props {
  block: Block<'block_project_overview'>
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="wrapper"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-[calc(var(--app-vertical-rhythm)/2)]': block.spacing_bottom,
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
