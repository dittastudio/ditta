<script lang="ts" setup>
import type { BentoMusicStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoMusicStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="w-full h-full bg-orange"
  >
    <!-- <pre>{{ block.component }}</pre> -->
  </div>
</template>
