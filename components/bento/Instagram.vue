<script lang="ts" setup>
import type { BentoInstagramStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoInstagramStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div v-editable="block">
    <pre>{{ block.component }}</pre>
  </div>
</template>
