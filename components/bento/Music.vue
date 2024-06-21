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
    class="bg-orange w-full h-full"
  >
    <!-- <pre>{{ block.component }}</pre> -->
  </div>
</template>
