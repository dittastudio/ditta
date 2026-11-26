<script lang="ts" setup>
import IconReturn from '@/assets/icons/return.svg'
import IconShift from '@/assets/icons/shift.svg'

// The Enter keycap on Next, or Shift+Enter on Back. The caller marks it data-brief-enter-key or
// data-brief-back-key for useBriefKeys to press.
interface Props {
  shift?: boolean
}

const { shift = false } = defineProps<Props>()
</script>

<template>
  <span class="flex gap-0.5">
    <UiKbd
      v-if="shift"
      tone="fixed"
      class="ml-2"
      ><IconShift class="size-3 fill-none"
    /></UiKbd>
    <UiKbd
      tone="fixed"
      :class="{ 'ml-2': !shift }"
      ><IconReturn class="size-3 fill-none"
    /></UiKbd>
  </span>
</template>
