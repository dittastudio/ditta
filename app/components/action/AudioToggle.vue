<script lang="ts" setup>
// The site's sound switch, in the Dock and in the brief's settings. One state, so turning it on in one turns it on in
// the other. Toggling plays its own on and off sounds (see useAudio). Other UiNavButton props (size) pass through.
interface Props {
  variant?: 'secondary' | 'plain'
  // Turns the accent while on, as the brief's settings do
  highlight?: boolean
}

const { variant = 'secondary', highlight = false } = defineProps<Props>()

const { isAudioOn, toggle } = useAudio()
</script>

<template>
  <UiNavButton
    square
    :variant="highlight && isAudioOn ? 'accent' : variant"
    :pressed="isAudioOn"
    aria-label="Sound"
    @click="toggle"
  >
    <IconSound
      :on="isAudioOn"
      class="size-4.5"
    />
  </UiNavButton>
</template>
