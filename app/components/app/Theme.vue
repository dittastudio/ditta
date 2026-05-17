<script lang="ts" setup>
import type { Themes } from '@/types/app'

type Accent = Extract<Themes, 'pink' | 'mood' | 'olive'>

const options: Array<{ value: Accent; label: string }> = [
  { value: 'pink', label: 'Pink' },
  { value: 'mood', label: 'Mood' },
  { value: 'olive', label: 'Olive' },
]

const bgClass: Record<Accent, string> = {
  pink: 'bg-pink',
  mood: 'bg-mood',
  olive: 'bg-olive',
}

const outlineClass: Record<Accent, string> = {
  pink: 'outline-pink',
  mood: 'outline-mood',
  olive: 'outline-olive',
}

const theme = useTheme()
</script>

<template>
  <ul class="flex gap-2 items-center justify-center">
    <li
      v-for="option in options"
      :key="option.value"
    >
      <button
        type="button"
        @click="theme = { ...theme, accent: option.value }"
      >
        <span class="sr-only">{{ option.label }}</span>
        <span
          class="block size-5 rounded-full outline-2 outline-offset-2 transition-colors duration-300 ease-outCubic"
          :class="[
            bgClass[option.value],
            theme.accent === option.value ? outlineClass[option.value] : 'outline-transparent',
          ]"
        />
      </button>
    </li>
  </ul>
</template>
