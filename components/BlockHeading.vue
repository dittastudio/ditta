<script setup lang="ts">
const themeColorMap: any = {
  offblack: 'bg-offblack text-offwhite',
  white: 'bg-white',
  offwhite: 'bg-offwhite',
  blue: 'bg-blue text-offwhite',
  pink: 'bg-pink',
}

export interface Props {
  theme?: string
  copy: string
}

const { theme = 'offwhite' } = defineProps<Props>()
</script>

<template>
  <span v-if="copy" class="block w-full border-y border-offblack p-[1em]" :class="themeColorMap[theme]">
    <span class="type-giga type-giga--adjust-height block">
      {{ copy }}
    </span>
  </span>
</template>
