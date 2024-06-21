<script lang="ts" setup>
import type { BentoMusicStoryblok } from '@/types/storyblok'
import IconPlay from '@/assets/icons/play.svg'
import IconPause from '@/assets/icons/pause.svg'

interface Props {
  block: BentoMusicStoryblok
}

const { block } = defineProps<Props>()
const playing = ref(false)
const file = ref<HTMLInputElement | null>(null)
const files = ref<FileList | null>(null)
const play = ref<HTMLButtonElement | null>(null)
const pause = ref<HTMLButtonElement | null>(null)
const equalizer = ref<HTMLCanvasElement | null>(null)
const audioElement = ref<HTMLAudioElement | null>(null)

const setFile = async (event: Event) => {
  files.value = (event.target as HTMLInputElement).files
}

onMounted(() => {
  play.value?.addEventListener('click', () => {
    if (!files.value || files.value.length === 0 || files.value.length > 1) {
      return
    }

    audioElement.value = new Audio(URL.createObjectURL(files.value[0]))
    const audioContext = new window.AudioContext()
    const source = audioContext.createMediaElementSource(audioElement.value)
    const analyser = audioContext.createAnalyser()

    source.connect(analyser)
    analyser.connect(audioContext.destination)
    analyser.fftSize = 256

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const canvas = equalizer.value
    const context = canvas?.getContext('2d')

    if (!canvas || !context) {
      return
    }

    const draw = () => {
      requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)
      context.fillStyle = '#FEDBB8'
      context.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 5

      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i]

        context.fillStyle = `rgb(253, 178, 104)` // `rgb(${barHeight + 100}, 0, 0)`
        context.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2)

        x += barWidth + 2
      }

      console.log(dataArray)
    }

    audioElement.value.play()
    playing.value = true
    draw()
  })

  pause.value?.addEventListener('click', () => {
    playing.value = false
    audioElement.value?.pause()
  })
})

const hasFileReady = computed(() => Boolean(files.value?.[0]))
</script>

<template>
  <div
    v-editable="block"
    class="relative bg-orange w-full h-full"
  >
    <canvas
      ref="equalizer"
      class="absolute inset-0 z-0 w-full h-full pointer-events-none opacity-50"
    />

    <input
      ref="file"
      type="file"
      accept="audio/*"
      class="absolute inset-0 block z-10 w-full h-full cursor-pointer opacity-0"
      @change="setFile"
    >

    <button
      v-show="!playing"
      ref="play"
      class="p-20 absolute right-0 bottom-0 z-50"
    >
      <span class="sr-only">Play</span>

      <IconPlay class="w-20 h-20 block" />
    </button>

    <button
      v-show="playing"
      ref="pause"
      class="p-20 absolute right-0 bottom-0 z-50"
    >
      <span class="sr-only">Pause</span>

      <IconPause class="w-20 h-20 block" />
    </button>

    <div
      class="absolute inset-32 z-20 pointer-events-none"
    >
      <ElementSpeaker class="record size-full" />
    </div>

    <p class="absolute z-50 left-20 bottom-16 text-12 font-bold text-offblack">
      <template v-if="hasFileReady">
        Ready, hit play!
      </template>

      <template v-else>
        Tap to select
      </template>
    </p>
  </div>
</template>

<style lang="postcss" scoped>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.record {
  animation: spin 10s linear infinite;
}
</style>
