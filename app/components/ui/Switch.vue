<script lang="ts" setup>
import { defineSound } from '@web-kits/audio'
import { checkbox } from '@@/.web-kits/core'

// A small on/off switch. Native attributes, its aria-label above all, fall through to the button.
const on = defineModel<boolean>({ default: false })

const soundCheckbox = defineSound(checkbox)
const { play } = useAudio()

function toggle() {
  on.value = !on.value
  play(soundCheckbox)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="on"
    class="relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-outCubic motion-reduce:transition-none"
    :class="on ? 'bg-olive' : 'bg-white/15 only-hover:hover:bg-white/25'"
    @click="toggle"
  >
    <span
      class="size-3 rounded-full bg-white transition-transform duration-200 ease-outCubic motion-reduce:transition-none"
      :class="{ 'translate-x-3': on }"
    />
  </button>
</template>
