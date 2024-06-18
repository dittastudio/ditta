<script lang="ts" setup>
import type { BentoTeamStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoTeamStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div v-editable="block">
    <pre>{{ block.component }}</pre>
  </div>
</template>
