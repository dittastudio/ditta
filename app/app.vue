<script lang="ts" setup>
const route = useRoute()
const audioRef = ref<HTMLAudioElement | null>(null)
const shotgunAudioRef = ref<HTMLAudioElement | null>(null)
const soundtrackRef = ref<HTMLAudioElement | null>(null)
const keySequence = ref('')
const mouseX = ref(0)
const mouseY = ref(0)
const isAnimating = ref(false)
const canShoot = ref(true)
const showShotgun = ref(false)

// Function to play audio and wait for it to finish
const playAudioAndWait = (audio: HTMLAudioElement): Promise<void> => {
  return new Promise((resolve) => {
    audio.play()
    audio.onended = () => resolve()
  })
}

// Function to play the door audio and then soundtrack
const playSecretAudio = async () => {
  if (!audioRef.value) {
    audioRef.value = new Audio('/sounds/doom-open-door.mp3')
  }
  if (!soundtrackRef.value) {
    soundtrackRef.value = new Audio('/sounds/doom-soundtrack.mp3')
    soundtrackRef.value.loop = true // Make the soundtrack loop
  }

  try {
    // Show shotgun when door sound starts
    showShotgun.value = true
    // Play door sound and wait for it to finish
    await playAudioAndWait(audioRef.value)
    // Then start the soundtrack
    await soundtrackRef.value.play()
  }
  catch (error) {
    console.error('Error playing audio:', error)
  }
}

// Function to play the shotgun audio
const playShotgunAudio = () => {
  if (!shotgunAudioRef.value) {
    shotgunAudioRef.value = new Audio('/sounds/doom-shotgun.mp3')
  }
  shotgunAudioRef.value.play()
}

// Function to reset everything
const resetShotgun = () => {
  showShotgun.value = false
  isAnimating.value = false
  canShoot.value = true
  keySequence.value = ''

  // Stop all audio
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
  }
  if (shotgunAudioRef.value) {
    shotgunAudioRef.value.pause()
    shotgunAudioRef.value.currentTime = 0
  }
  if (soundtrackRef.value) {
    soundtrackRef.value.pause()
    soundtrackRef.value.currentTime = 0
  }
}

// Handle keyboard input
const handleKeyPress = async (event: KeyboardEvent) => {
  // Handle ESC key
  if (event.key === 'Escape') {
    resetShotgun()
    return
  }

  // Only track alphanumeric keys
  if (!/^[a-z0-9]$/i.test(event.key))
    return

  // Add the key to our sequence and keep only last 5 characters
  keySequence.value = (keySequence.value + event.key).slice(-5)

  // Check if sequence matches 'iddqd'
  if (keySequence.value.toLowerCase() === 'iddqd') {
    await playSecretAudio()
    // Reset sequence after triggering
    keySequence.value = ''
  }
}

// Track mouse movement
const handleMouseMove = (event: MouseEvent) => {
  // Calculate mouse position as a percentage of window size
  mouseX.value = (event.clientX / window.innerWidth - 0.5) * 2 // -1 to 1
  mouseY.value = (event.clientY / window.innerHeight - 0.5) * 2 // -1 to 1
}

// Handle mouse click
const handleMouseClick = () => {
  if (!showShotgun.value || !canShoot.value)
    return // Prevent shooting if shotgun isn't visible or animation is in progress

  canShoot.value = false
  isAnimating.value = true
  playShotgunAudio()

  // Reset animation state after one cycle
  setTimeout(() => {
    isAnimating.value = false
    canShoot.value = true // Re-enable shooting after animation completes
  }, 1000) // Match animation duration
}

// Add and remove event listeners
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('click', handleMouseClick)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('click', handleMouseClick)
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value = null
  }
  if (shotgunAudioRef.value) {
    shotgunAudioRef.value.pause()
    shotgunAudioRef.value = null
  }
  if (soundtrackRef.value) {
    soundtrackRef.value.pause()
    soundtrackRef.value = null
  }
})

const globalClasses = computed(() => ({
  'is-storyblok-editor': storyblokEditor(route.query),
}))

useHead({
  htmlAttrs: {
    class: globalClasses,
  },
})

useSeoMeta({
  titleTemplate: title => (title ? `${title} - ditta` : 'ditta'),
  robots: 'index, follow',
})

useScriptPlausibleAnalytics({
  domain: 'ditta.studio',
  extension: ['file-downloads', 'outbound-links'],
})
</script>

<template>
  <div>
    <NuxtPage />

    <div
      class="doom-shotgun fixed inset-0 flex items-end justify-center z-50 overflow-hidden pointer-events-none transition-[opacity,translate] duration-1000 ease-smooth"
      :class="{
        'opacity-0 translate-y-1/4': !showShotgun,
        'opacity-100 translate-y-0': showShotgun,
      }"
    >
      <div
        class="doom-shotgun-sprite w-[239px] h-[303px] bg-no-repeat bg-[url('/imgs/doom/shotgun-sprite.png')] bg-[position:0_0] mb-[-4px]"
        :class="{ 'is-animating': isAnimating }"
        :style="{
          transform: `translate(${mouseX * 100}%, ${mouseY * 1}%) skew(${mouseX * -5}deg) scaleY(${1 - mouseY * 0.05})`,
          transformOrigin: 'bottom center',
          transition: 'transform 0.1s ease-out',
        }"
      />
    </div>

    <AppFooter />
  </div>
</template>

<style scoped>
.doom-shotgun-sprite.is-animating {
  animation: play-shotgun 1s steps(8) forwards;
}

@keyframes play-shotgun {
  from { background-position: 0 0; }
  to { background-position: -1912px 0; } /* 239px * 8 frames */
}
</style>
