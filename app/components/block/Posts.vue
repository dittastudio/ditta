<script lang="ts" setup>
import type { BlockPosts } from '#storyblok-components'

interface Props {
  block: BlockPosts
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="wrapper flex flex-col justify-center"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <pre>{{ block }}</pre>
  </div>
</template>
