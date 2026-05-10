<script setup lang="ts">
import type { Themes } from '@/types/app'
import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'

interface Props {
  theme?: Themes
  text?: string
}

const { theme = 'light', text } = defineProps<Props>()
</script>

<template>
  <span
    class="ui-button select-none inline-flex items-center gap-[0.71em] font-medium leading-none rounded-full py-2.5 md:py-3.75 pr-2.5 md:pr-3.75 pl-5 md:pl-6 transition-colors duration-250 ease-outCubic hover:bg-black hover:text-white"
    :class="[theme ? themeClasses[theme as Themes] : '']"
  >
    <span
      v-if="text"
      class="mt-[-0.15em] mb-[-0.1em]"
    >
      {{ text }}
    </span>

    <span class="ui-button__icon size-[1em] rounded-full aspect-square bg-accent flex items-center justify-center">
      <IconPixelArrow class="arrow w-5 rotate-45" />
    </span>
  </span>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.ui-button {
  font-size: utopia.clamp(16, 28);
}

.ui-button__icon {
  font-size: utopia.clamp(30, 40);
}
</style>
