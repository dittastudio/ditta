<script lang="ts" setup>
import type { ElementVinyl } from '#build/components'
import type { BentoMusicStoryblok } from '@/types/storyblok'
import IconPlay from '@/assets/icons/play.svg'
import IconPause from '@/assets/icons/pause.svg'
import IconCross from '@/assets/icons/cross.svg'

interface Props {
  block: BentoMusicStoryblok
}

interface Track {
  name: string
  path: string
}

const { block } = defineProps<Props>()
const playing = ref(false)
const vinyl = ref<InstanceType<typeof ElementVinyl> | null>(null)
const files = ref<FileList | null>(null)
const play = ref<HTMLButtonElement | null>(null)
const pause = ref<HTMLButtonElement | null>(null)
const equalizer = ref<HTMLCanvasElement | null>(null)
const audioElement = ref<HTMLAudioElement | null>(null)
const listingVisible = ref(false)
const track = ref<Track | null>(null)

const playlist: Track[] = [
  { name: 'Classical', path: '/audio/classical.mp3' },
  { name: 'Hard Rock', path: '/audio/hard-rock.mp3' },
  { name: 'Disco', path: '/audio/disco.mp3' },
]

const createEqualizer = (analyser: AnalyserNode) => {
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
  }

  draw()
}

const setAudio = () => {
  const audioItem = track.value
    ? track.value.path
    : files.value?.[0] ? URL.createObjectURL(files.value[0]) : null

  if (!audioItem) {
    return
  }

  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }

  audioElement.value = new Audio(audioItem)

  const audioContext = new window.AudioContext()
  const source = audioContext.createMediaElementSource(audioElement.value)
  const analyser = audioContext.createAnalyser()

  source.connect(analyser)
  analyser.connect(audioContext.destination)
  analyser.fftSize = 256

  createEqualizer(analyser)

  audioElement.value.play()
  playing.value = true
}

const setFile = async (event: Event) => {
  listingVisible.value = false
  track.value = null
  files.value = (event.target as HTMLInputElement).files

  setAudio()
}

const setTrack = (item: Track) => {
  listingVisible.value = false
  files.value = null

  if (track.value?.path !== item.path) {
    track.value = item

    setAudio()
  }
}

const playAudio = () => {
  if (!audioElement.value) {
    return
  }

  audioElement.value.play()
  playing.value = true
}

const pauseAudio = () => {
  if (!audioElement.value) {
    return
  }

  audioElement.value?.pause()
  playing.value = false
}

const setSpinning = (value: boolean) => {
  if (vinyl.value?.$el) {
    vinyl.value.$el.style.animationPlayState = value ? 'running' : 'paused'
  }
}

watch(() => playing.value, (value) => {
  setSpinning(value)
})

onMounted(() => {
  setSpinning(playing.value)

  play.value?.addEventListener('click', playAudio)
  pause.value?.addEventListener('click', pauseAudio)
})

onUnmounted(() => {
  play.value?.removeEventListener('click', playAudio)
  pause.value?.removeEventListener('click', pauseAudio)
})
</script>

<template>
  <div
    v-editable="block"
    class="@container relative bg-orange w-full h-full"
  >
    <canvas
      ref="equalizer"
      class="absolute inset-0 z-0 w-full h-full opacity-50 pointer-events-none"
    />

    <button
      v-show="!playing"
      ref="play"
      type="button"
      class="absolute bottom-0 right-0 z-50 p-20"
    >
      <span class="sr-only">Play</span>

      <IconPlay class="block w-20 h-20" />
    </button>

    <button
      v-show="playing"
      ref="pause"
      type="button"
      class="absolute bottom-0 right-0 z-50 p-20"
    >
      <span class="sr-only">Pause</span>

      <IconPause class="block w-20 h-20" />
    </button>

    <button
      type="button"
      class="inset-32 absolute z-20"
      @click="listingVisible = true"
    >
      <span class="sr-only">Open Playlist</span>

      <ElementVinyl
        ref="vinyl"
        class="vinyl size-full"
      />
    </button>

    <p class="left-20 bottom-16 text-12 text-offblack absolute z-50 font-bold">
      <template v-if="track">
        {{ track.name }}
      </template>

      <template v-else-if="files">
        {{ files[0]?.name || 'Custom' }}
      </template>

      <template v-else>
        Tap to select
      </template>
    </p>

    <div
      class="inset-10 bg-offblack rounded-xl absolute z-50 grid items-center grid-cols-2 p-20 transition-opacity duration-300 opacity-0 pointer-events-none"
      :class="{ 'opacity-100 pointer-events-auto': listingVisible }"
    >
      <button
        type="button"
        class="hover:opacity-100 focus:opacity-100 absolute top-0 left-0 z-50 p-20 transition-opacity duration-300 opacity-50"
        @click="listingVisible = false"
      >
        <span class="sr-only">Close Playlist</span>

        <IconCross class="size-16 @2xs:size-20 block text-white rotate-45" />
      </button>

      <ul class="flex flex-col gap-4 @2xs:gap-0">
        <li
          v-for="item in playlist"
          :key="item.path"
        >
          <button
            type="button"
            class="text-12 @2xs:text-16 flex items-center justify-start gap-8 hover:text-white focus:text-white transition-colors text-left"
            :class="`${track?.path === item.path ? 'text-white' : 'text-white/50'}`"
            @click="setTrack(item)"
          >
            <span
              class="block w-8 h-8 rounded-full"
              :class="`${track?.path === item.path ? 'bg-green' : 'bg-white/50'}`"
            />
            {{ item.name }}
          </button>
        </li>
      </ul>

      <div class="relative flex flex-col items-center justify-center">
        <input
          type="file"
          accept="audio/*"
          class="input left-1/2 absolute block w-full h-full -translate-x-1/2 opacity-0 cursor-pointer"
          title="Select your own music"
          @change="setFile"
        >

        <div class="w-50 h-50 bg-green flex flex-col items-center justify-center p-10 rounded-full">
          <IconCross class="size-full text-offblack" />
        </div>
      </div>
    </div>
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

.vinyl {
  animation: spin 5s linear infinite;
}

.input::-webkit-file-upload-button {
  cursor: pointer;
}
</style>
