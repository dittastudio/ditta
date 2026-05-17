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

const ringClass: Record<Accent, string> = {
  pink: 'ring-pink',
  mood: 'ring-mood',
  olive: 'ring-olive',
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
          class="block aspect-square w-5 rounded-full ring-2 ring-offset-2 ring-offset-black transition-[ring-color] duration-200"
          :class="[bgClass[option.value], theme.accent === option.value ? ringClass[option.value] : 'ring-transparent']"
        />
      </button>
    </li>
  </ul>
</template>
