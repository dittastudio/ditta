<script setup lang="ts">
import type { Themes } from '@/types/app'

interface Props {
  text: string
  size?: 'small' | 'medium' | 'large'
  theme?: Themes
}

const { text, size = 'small', theme } = defineProps<Props>()
</script>

<template>
  <span
    class="ui-chip inline-flex font-medium leading-none rounded-full"
    :class="[
      {
        'text-14 px-4 py-3': size === 'small',
        'ui-chip--medium': size === 'medium',
        'ui-chip--large': size === 'large',
      },
      theme ? themeClasses[theme as Themes] : '',
    ]"
  >
    <span class="mt-[-0.15em] mb-[-0.1em]">
      {{ text }}
    </span>
  </span>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.ui-chip--medium {
  font-size: utopia.clamp(14, 16);
  padding-block: utopia.clamp(12, 16);
  padding-inline: utopia.clamp(16, 20);
}

.ui-chip--large {
  font-size: utopia.clamp(14, 28);
  padding-block: utopia.clamp(12, 24);
  padding-inline: utopia.clamp(16, 24);
}
</style>
