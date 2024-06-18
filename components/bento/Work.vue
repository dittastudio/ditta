<script lang="ts" setup>
import type { BentoWorkStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoWorkStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div v-editable="block">
    <pre>{{ block.component }}</pre>
  </div>
</template>
