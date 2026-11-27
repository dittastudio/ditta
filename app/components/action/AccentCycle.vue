<script lang="ts" setup>
import { gsap } from 'gsap'
import { defineSound } from '@web-kits/audio'
import { select } from '@@/.web-kits/playful'

// The accent as one swatch, in the brief's settings: each press moves it on to the next (pink, mood, olive, round
// again) and the site takes it at once. The same choice as the Dock's swatches (ActionAccent), with their sound. Named
// by the colour it's on, so a press is heard as the new colour. Other UiNavButton props (size) pass through.
const appStore = useAppStore()
const soundSelect = defineSound(select)
const { play } = useAudio()

const name = computed(() => appStore.accent.charAt(0).toUpperCase() + appStore.accent.slice(1))

// Each press pops the swatch from a touch smaller with a small overshoot, so quick presses each land as a step
const swatch = useTemplateRef('swatch')

function cycle() {
  appStore.cycleAccent()
  play(soundSelect)

  if (!swatch.value || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  gsap.fromTo(
    swatch.value,
    { scale: 0.85 },
    { scale: 1, duration: 0.4, ease: 'back.out(3)', overwrite: true, clearProps: 'transform' },
  )
}
</script>

<template>
  <UiNavButton
    square
    :aria-label="`Colour: ${name}`"
    @click="cycle"
  >
    <span
      ref="swatch"
      class="block size-5 rounded-full bg-accent transition-colors duration-hover ease-outCubic"
      aria-hidden="true"
    />
  </UiNavButton>
</template>
