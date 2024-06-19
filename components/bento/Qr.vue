<script lang="ts" setup>
import type { BentoQrStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoQrStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="w-full h-full bg-blue"
  >
    <!-- <pre>{{ block.component }}</pre> -->
  </div>
</template>
