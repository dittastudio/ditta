<script lang="ts" setup>
import type { Accent } from '@/stores/app'
import { defineSound } from '@web-kits/audio'
import { select } from '@@/.web-kits/playful'

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

const soundSelect = defineSound(select)
const { play } = useAudio()

const appStore = useAppStore()
</script>

<template>
  <fieldset class="contents">
    <legend class="sr-only">Accent colour</legend>

    <ClientOnly>
      <ul class="flex gap-3 items-center justify-center">
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
              @change="play(soundSelect)"
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
    </ClientOnly>
  </fieldset>
</template>
