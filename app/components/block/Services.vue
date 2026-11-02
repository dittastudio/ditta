<script lang="ts" setup>
import { defineSound } from '@web-kits/audio'
import { sync } from '@@/.web-kits/core'
import { useAppStore } from '@/stores/app'
import type { Block } from '#storyblok-schema'

interface Props {
  block: Block<'block_services'>
}

const { block } = defineProps<Props>()

const containerRef = useTemplateRef('container')
const chipRefs = useTemplateRef('chipRef')
const computerRef = useTemplateRef('computer')

const { ready, isDragging, pageScrolling } = useChipPhysics(containerRef, chipRefs)

useMouseTilt(computerRef)

const services = await useDatasource('services', block.services)

const soundClick = defineSound(sync)
const { play, isAudioOn } = useAudio()

const preloadedImgs = new Set<string>()

const preloadImg = (src: string) => {
  if (preloadedImgs.has(src)) return
  preloadedImgs.add(src)
  const img = new Image()
  img.src = src
}

const sounds = {
  error: defineSample('/sounds/winxperror.opus'),
  restart: defineSample('/sounds/winxpstartup.opus'),
  ps: defineSample('/sounds/ps-startup.opus'),
  nintendo: defineSample('/sounds/nintendo-startup.opus'),
  epicSax: defineSample('/sounds/epicsaxguy.opus'),
}

let jazzInterval: ReturnType<typeof setInterval> | null = null

watch(isAudioOn, (on) => on && sounds.error.load(), { immediate: true })

const appStore = useAppStore()

const rageCount = ref(0)
const rageScreen = ref('/imgs/blue-screen.svg')

let rageTimeout: ReturnType<typeof setTimeout> | null = null
let psScreenTimeout: ReturnType<typeof setTimeout> | null = null

const preloadNextRage = () => {
  preloadImg('/imgs/blue-screen.svg')
  const upcoming = (rageCount.value + 1) % 4
  if (upcoming === 1) {
    preloadImg('/imgs/windowsxp-screen.svg')
    if (isAudioOn.value) sounds.restart.load()
  } else if (upcoming === 2) {
    preloadImg('/imgs/ps-screen-1.svg')
    preloadImg('/imgs/ps-screen-2.svg')
    if (isAudioOn.value) sounds.ps.load()
  } else if (upcoming === 3) {
    preloadImg('/imgs/nintendo-screen.svg')
    if (isAudioOn.value) sounds.nintendo.load()
  } else {
    preloadImg('/imgs/jazz-1.svg')
    preloadImg('/imgs/jazz-2.svg')
    if (isAudioOn.value) sounds.epicSax.load()
  }
}

const onRage = () => {
  rageScreen.value = '/imgs/blue-screen.svg'
  void sounds.error.play()

  if (!isAudioOn.value) {
    rageTimeout = setTimeout(resetRage, RAGE_SILENT_HOLD)
    return
  }

  rageCount.value++
  const sequence = rageCount.value % 4

  // Each boot screen stays up for as long as its sound plays
  rageTimeout = setTimeout(async () => {
    if (sequence === 1) {
      rageScreen.value = '/imgs/windowsxp-screen.svg'
      await sounds.restart.play()
    } else if (sequence === 2) {
      rageScreen.value = '/imgs/ps-screen-1.svg'
      psScreenTimeout = setTimeout(() => {
        rageScreen.value = '/imgs/ps-screen-2.svg'
      }, 7200)
      await sounds.ps.play()
      clearTimeout(psScreenTimeout)
    } else if (sequence === 3) {
      rageScreen.value = '/imgs/nintendo-screen.svg'
      await sounds.nintendo.play()
    } else {
      let jazzToggle = false

      rageScreen.value = '/imgs/jazz-1.svg'
      jazzInterval = setInterval(() => {
        jazzToggle = !jazzToggle
        rageScreen.value = jazzToggle ? '/imgs/jazz-2.svg' : '/imgs/jazz-1.svg'
      }, 465)
      await sounds.epicSax.play()
      clearInterval(jazzInterval)
    }

    resetRage()
  }, 2000)
}

const {
  inRage,
  shakeClass,
  click: onComputerClick,
  resetRage,
} = useRageClicks({
  onFirstClick: preloadNextRage,
  onClick: () => {
    appStore.cycleAccent()
    play(soundClick)
  },
  onRage,
})

onUnmounted(() => {
  if (rageTimeout) clearTimeout(rageTimeout)
  if (psScreenTimeout) clearTimeout(psScreenTimeout)
  if (jazzInterval) clearInterval(jazzInterval)
})
</script>

<template>
  <div
    v-editable="block"
    class="relative overflow-hidden"
  >
    <div
      class="relative wrapper z-1 pointer-events-none"
      :class="{
        'pt-(--app-vertical-rhythm)': block.spacing_top,
        'pb-(--app-vertical-rhythm)': block.spacing_bottom,
      }"
    >
      <div
        :class="isDragging ? '*:pointer-events-none' : '*:pointer-events-auto'"
        class="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-5 pb-80"
      >
        <UiLockup
          class="col-span-full md:col-span-8"
          :heading="block.heading"
          :copy="block.copy"
        />

        <div class="col-span-full md:col-span-4">
          <div
            class="w-50 md:w-62.5 mx-auto md:ml-auto"
            :class="shakeClass"
          >
            <IconComputer
              ref="computer"
              class="tappable animate-bob rotate-(--tilt) w-full text-accent cursor-pointer"
              :class="{ pokeable: !inRage }"
              :in-rage="inRage"
              :screen-src="rageScreen"
              @mousedown.prevent
              @click="onComputerClick"
            />
          </div>
        </div>
      </div>
    </div>

    <ul
      ref="container"
      class="absolute inset-0 z-0 select-none touch-pan-y touch-pinch-zoom"
    >
      <!-- iOS ignores touch-action unless it's on the very element touched, hence **: -->
      <li
        v-for="service in services"
        :key="service.id"
        ref="chipRef"
        class="absolute top-0 left-0 rounded-full touch-pinch-zoom **:touch-pinch-zoom will-change-transform transition-opacity duration-500"
        :class="[ready ? 'opacity-100' : 'opacity-0', { 'touch-pan-y **:touch-pan-y': pageScrolling }]"
      >
        <UiChip
          v-memo="[service.name]"
          :text="service.name"
          size="large"
          theme="light"
        />
      </li>
    </ul>
  </div>
</template>
