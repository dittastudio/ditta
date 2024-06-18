<script lang="ts" setup>
import type { BentoWeatherStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoWeatherStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div v-editable="block">
    <pre>{{ block.component }}</pre>
  </div>
</template>
