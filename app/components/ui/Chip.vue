<script setup lang="ts">
import type { Themes } from '@/types/app'

interface Props {
  theme?: Themes
  text: string
}

const { theme, text } = defineProps<Props>()
</script>

<template>
  <span
    class="inline-flex text-lead font-[600] leading-none rounded-full p-[0.8em]"
    :class="[theme ? themeClasses[theme as Themes] : '']"
  >
    <span class="mt-[-0.15em] mb-[-0.1em]">
      {{ text }}
    </span>
  </span>
</template>

<style scoped>
@reference "@/assets/css/app.css";
</style>
