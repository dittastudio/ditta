<script setup lang="ts">
import IconExternal from '@/assets/icons/external.svg'

interface Props {
  isExternal?: boolean
}

const { isExternal = false } = defineProps<Props>()
</script>

<template>
  <span
    class="
      inline-flex
      items-center
      gap-[0.25em]
    "
  >
    <slot />

    <IconExternal
      v-if="isExternal"
      class="
        size-[0.45em]
        [a_&]:transition-transform
        [a_&]:duration-200
        [a_&]:ease-out
        [a:hover_&]:translate-x-[0.125em]
        [a:hover_&]:-translate-y-[0.125em]
      "
    />
  </span>
</template>
