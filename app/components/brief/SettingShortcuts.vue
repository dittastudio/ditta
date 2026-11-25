<script lang="ts" setup>
import { defineSound } from '@web-kits/audio'
import { toggleOff, toggleOn } from '@@/.web-kits/core'
import IconKeyboard from '@/assets/icons/keyboard.svg'

// The keyboard shortcuts setting, in the nav's settings row: a keyboard icon that turns the accent while on.
// Hovering it, or reaching it with Tab, shows the brief's keys faintly (see UiKbd), so it's clear what it turns on.
// A click to focus doesn't count: the pointer is already previewing.
const brief = useBriefStore()

const soundToggleOn = defineSound(toggleOn)
const soundToggleOff = defineSound(toggleOff)
const { play } = useAudio()

function toggle() {
  brief.settings.shortcuts = !brief.settings.shortcuts
  play(brief.settings.shortcuts ? soundToggleOn : soundToggleOff)
}

function preview(on: boolean) {
  brief.previewShortcuts = on
}

function onFocus(event: FocusEvent) {
  if ((event.target as HTMLElement).matches(':focus-visible')) preview(true)
}

// The setting goes with the row, so a preview can't outlive it
onBeforeUnmount(() => preview(false))
</script>

<!-- One of the nav's icon buttons, which plays their hover sound -->
<template>
  <BriefNavButton
    square
    role="switch"
    :variant="brief.settings.shortcuts ? 'accent' : 'secondary'"
    :aria-checked="brief.settings.shortcuts"
    aria-label="Keyboard shortcuts"
    @click="toggle"
    @pointerenter="preview(true)"
    @pointerleave="preview(false)"
    @focus="onFocus"
    @blur="preview(false)"
  >
    <IconKeyboard
      class="size-4.5"
      aria-hidden="true"
    />
  </BriefNavButton>
</template>
