<template>
  <span v-if="copy" class="block-heading" :class="themeColorMap[theme]">
    <span class="block-heading__copy type-giga type-giga--adjust-height">
      {{ copy }}
    </span>
  </span>
</template>

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

<style lang="postcss" scoped>
.block-heading {
  overflow: hidden;
  display: block;

  width: 100%;
  padding: theme('spacing.16');

  border-block: thin solid theme('colors.offblack');
}

.block-heading__copy {
  display: block;
}
</style>
