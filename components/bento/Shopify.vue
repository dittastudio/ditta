<script lang="ts" setup>
import type { BentoShopifyStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoShopifyStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div v-editable="block">
    <pre>{{ block.component }}</pre>
  </div>
</template>
