<script lang="ts" setup>
import type { BlockBentoBoxStoryblok } from '@/types/storyblok'

interface Props {
  block: BlockBentoBoxStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="grid gap-x-[var(--app-inner-gutter)] md:grid-cols-2 px-[var(--app-outer-gutter)]"
  >
    <pre>{{ block }}</pre>
  </div>
</template>
