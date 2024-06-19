<script lang="ts" setup>
import type { BentoGameStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoGameStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="w-full h-full bg-offblack"
  >
    <!-- <pre>{{ block.component }}</pre> -->
  </div>
</template>
