<script lang="ts" setup>
const route = useRoute()
const audioRef = ref<HTMLAudioElement | null>(null)
const keySequence = ref('')

// Function to play the audio
const playSecretAudio = () => {
  if (!audioRef.value) {
    audioRef.value = new Audio('/sounds/doom-close.mp3') // You'll need to add this audio file to your public directory
  }
  audioRef.value.play()
}

// Handle keyboard input
const handleKeyPress = (event: KeyboardEvent) => {
  // Only track alphanumeric keys
  if (!/^[a-z0-9]$/i.test(event.key))
    return

  // Add the key to our sequence and keep only last 5 characters
  keySequence.value = (keySequence.value + event.key).slice(-5)

  // Check if sequence matches 'iddqd'
  if (keySequence.value.toLowerCase() === 'iddqd') {
    playSecretAudio()
    // Reset sequence after triggering
    keySequence.value = ''
  }
}

// Add and remove event listeners
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value = null
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

    <AppFooter />
  </div>
</template>
