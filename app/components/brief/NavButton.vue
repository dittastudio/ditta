<script lang="ts" setup>
import { defineSound } from '@web-kits/audio'
import { hover } from '@@/.web-kits/core'

interface Props {
  // `primary` has a faint square at rest (Next). `secondary` is the Dock's: grey, its square only on hover.
  // `danger` is coral on a faint coral square (the clear confirm's Clear). `accent` is a setting that's on.
  variant?: 'primary' | 'secondary' | 'danger' | 'accent'
  // A square for an icon alone, rather than as wide as its text
  square?: boolean
}

const { variant = 'secondary', square = false } = defineProps<Props>()

const variants = {
  primary: 'bg-white/15 text-white only-hover:hover:bg-white/25',
  secondary: 'text-grey/70 only-hover:hover:bg-white/15 only-hover:hover:text-white',
  danger: 'bg-coral/15 text-coral only-hover:hover:bg-coral/25',
  accent: 'bg-accent/15 text-accent only-hover:hover:bg-accent/25',
}

const soundHover = defineSound(hover)
const { play } = useAudio()
</script>

<!-- The brief nav's buttons, after the Dock's burger and sound toggles: a squircle the bar's height less its p-2 -->
<template>
  <button
    type="button"
    class="flex h-(--brief-nav-button) shrink-0 items-center justify-center rounded-16 corner-shape-squircle text-14 font-medium whitespace-nowrap transition-[background-color,color,scale] duration-hover ease-outCubic active:scale-96 md:text-16"
    :class="[variants[variant], square ? 'w-(--brief-nav-button)' : 'px-4']"
    @pointerenter="play(soundHover)"
  >
    <slot />
  </button>
</template>
