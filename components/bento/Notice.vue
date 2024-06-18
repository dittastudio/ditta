<script lang="ts" setup>
import type { BentoNoticeStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoNoticeStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div v-editable="block">
    <pre>{{ block.component }}</pre>
  </div>
</template>
