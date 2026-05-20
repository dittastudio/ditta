<script lang="ts" setup>
import type { Accent } from '@/stores/app'

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

const appStore = useAppStore()
</script>

<template>
  <fieldset class="contents">
    <legend class="sr-only">Accent colour</legend>

    <ul class="flex gap-2 items-center justify-center">
      <li
        v-for="option in options"
        :key="option.value"
      >
        <label>
          <span class="sr-only">{{ option.label }}</span>

          <input
            type="radio"
            name="accent"
            class="sr-only"
            :value="option.value"
            v-model="appStore.accent"
          />

          <span
            class="block size-5 rounded-full outline-2 outline-offset-2 transition-colors duration-300 ease-outCubic"
            :class="[
              bgClass[option.value],
              appStore.accent === option.value ? outlineClass[option.value] : 'outline-transparent',
            ]"
          />
        </label>
      </li>
    </ul>
  </fieldset>
</template>
