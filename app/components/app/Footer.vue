<script lang="ts" setup>
import type { RichTextFieldValue } from '@storyblok/schema'
import { defineSound, type SoundDefinition } from '@web-kits/audio'
import { useRafFn } from '@vueuse/core'

interface Props {
  text?: RichTextFieldValue | null
}

const { text } = defineProps<Props>()

const email = 'hello@ditta.studio'

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

const createRobotBeep = (): SoundDefinition => ({
  layers: [0, 1, 2].map((index) => ({
    source: {
      type: 'square',
      frequency: { start: randomBetween(350, 1300), end: randomBetween(300, 2200) },
    },
    envelope: {
      attack: 0.003,
      decay: randomBetween(0.06, 0.12),
      sustain: randomBetween(0.15, 0.35),
      release: 0.03,
    },
    lfo: { type: 'sine', frequency: randomBetween(30, 75), depth: randomBetween(180, 420), target: 'frequency' },
    filter: { type: 'lowpass', frequency: randomBetween(4200, 6800) },
    gain: randomBetween(0.1, 0.2),
    delay: index * randomBetween(0.08, 0.16),
  })),
})

const { play, isAudioOn } = useAudio()

const playRobot = () => play(() => defineSound(createRobotBeep())())

let audioRage: HTMLAudioElement | null = null

watch(
  isAudioOn,
  (on) => {
    if (!on || audioRage) return

    audioRage = new Audio('/sounds/beepboop.opus')
    audioRage.preload = 'auto'
    audioRage.volume = 1
  },
  { immediate: true },
)

const rotation = ref(0)
const mouseXPercent = ref(50)
const mouseYPercent = ref(50)

let lastClientX = 0
let lastClientY = 0

const onMouseMove = (event: MouseEvent) => {
  lastClientX = event.clientX
  lastClientY = event.clientY
}

const { pause: pauseMouseTracking, resume: resumeMouseTracking } = useRafFn(
  () => {
    rotation.value = (lastClientX / window.innerWidth) * 80 - 40
    mouseXPercent.value = (lastClientX / window.innerWidth) * 100
    mouseYPercent.value = (lastClientY / window.innerHeight) * 100
  },
  { immediate: false },
)

const clickTimes: number[] = []
const inRage = ref(false)
const shakeLevel = ref(0)

let rageTimeout: ReturnType<typeof setTimeout> | null = null
let shakeResetTimeout: ReturnType<typeof setTimeout> | null = null

const shakeClass = computed(() => {
  if (inRage.value || shakeLevel.value <= 1) return ''
  if (shakeLevel.value <= 3) return 'robot-shake-1'
  if (shakeLevel.value <= 5) return 'robot-shake-2'
  return 'robot-shake-3'
})

const LEG_FLICKER_DURATION_MS = 300
const LEG_COLOR_DEFAULT = '#FFA4D2'
const LEG_COLOR_RED = '#F00'
const LEG_COUNT = 6

const legColors = ref<string[]>(Array(LEG_COUNT).fill(LEG_COLOR_DEFAULT))
const flickeringLegs = ref<Set<number>>(new Set())

let legFlickerTimeout: ReturnType<typeof setTimeout> | null = null

const stopLegFlicker = () => {
  if (legFlickerTimeout) {
    clearTimeout(legFlickerTimeout)
    legFlickerTimeout = null
  }
  flickeringLegs.value = new Set()
}

const randomLegIndices = () => {
  const count = Math.floor(randomBetween(3, 7))
  const indices = [...Array(LEG_COUNT).keys()]

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j]!, indices[i]!]
  }

  return new Set(indices.slice(0, count))
}

const startLegFlicker = () => {
  if (legFlickerTimeout) clearTimeout(legFlickerTimeout)

  flickeringLegs.value = randomLegIndices()
  legFlickerTimeout = setTimeout(() => {
    flickeringLegs.value = new Set()
    legFlickerTimeout = null
  }, LEG_FLICKER_DURATION_MS)
}

let rageEndedHandler: (() => void) | null = null

const resetRage = () => {
  inRage.value = false
  legColors.value = Array(LEG_COUNT).fill(LEG_COLOR_DEFAULT)
}

const playRage = () => {
  if (!audioRage || !isAudioOn.value) {
    rageTimeout = setTimeout(resetRage, 2000)
    return
  }

  audioRage.currentTime = 0

  rageEndedHandler = () => {
    resetRage()
    audioRage?.removeEventListener('ended', rageEndedHandler!)
    rageEndedHandler = null
  }

  audioRage.addEventListener('ended', rageEndedHandler)
  audioRage.play().catch(() => {})
}

const onRobotClick = () => {
  if (inRage.value) return

  const now = Date.now()
  clickTimes.push(now)

  const cutoff = now - 1500
  while (clickTimes.length && clickTimes[0]! < cutoff) clickTimes.shift()

  shakeLevel.value = clickTimes.length

  if (shakeResetTimeout) clearTimeout(shakeResetTimeout)
  shakeResetTimeout = setTimeout(() => {
    shakeLevel.value = 0
  }, 500)

  if (clickTimes.length >= 7) {
    clickTimes.length = 0
    shakeLevel.value = 0
    if (shakeResetTimeout) clearTimeout(shakeResetTimeout)
    stopLegFlicker()
    legColors.value = Array(LEG_COUNT).fill(LEG_COLOR_RED)
    inRage.value = true
    playRage()

    return
  }

  startLegFlicker()
  playRobot()
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  resumeMouseTracking()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  pauseMouseTracking()
  if (rageTimeout) clearTimeout(rageTimeout)
  if (shakeResetTimeout) clearTimeout(shakeResetTimeout)
  if (rageEndedHandler) audioRage?.removeEventListener('ended', rageEndedHandler)
  audioRage?.pause()
  stopLegFlicker()
})
</script>

<template>
  <UiTheme
    tag="footer"
    theme="dark"
    id="contact"
    class="min-h-screen flex"
  >
    <div class="relative wrapper w-full pt-25 md:pt-(--app-gutter-outer) pb-10 flex flex-col justify-between gap-6">
      <div class="flex flex-col items-start lg:flex-row justify-between max-lg:grow">
        <div
          v-if="storyblokRichTextContent(text)"
          :class="[
            'prose',
            'text-pretty',
            'prose-h2:text-heading',
            'prose-h2:max-w-[18em]',
            'prose-p:text-lead',
            'prose-p:text-beige',
            'prose-p:max-w-[23em]',
          ]"
        >
          <StoryblokText :html="text" />
        </div>

        <div
          class="max-lg:grow max-lg:w-full flex flex-col items-center justify-center max-lg:py-[calc(var(--app-vertical-rhythm)*0.5)] gap-6"
        >
          <div
            class="footer__robot relative lg:left-[-2.5%] h-36 md:h-50 aspect-336/278"
            :class="shakeClass"
            :style="{
              transform: `rotate(${rotation}deg)`,
              '--mouse-x-percent': mouseXPercent,
              '--mouse-y-percent': mouseYPercent,
            }"
            @click="onRobotClick"
          >
            <div class="relative animate-bob">
              <IconRobot
                class="w-full h-full"
                :in-rage="inRage"
                :leg-colors="legColors"
                :flickering-legs="flickeringLegs"
              />

              <span class="footer__eye footer__eye--left" />
              <span class="footer__eye footer__eye--right" />
            </div>
          </div>
        </div>
      </div>

      <a
        class="footer__link block whitespace-nowrap text-center"
        href="mailto:hello@ditta.studio"
        aria-label="Email Ditta at hello@ditta.studio"
      >
        <UiTextMorph
          :min-weight="400"
          :text="email"
        />
      </a>
    </div>
  </UiTheme>
</template>

<style scoped>
.footer__link {
  font-size: min(calc(9.5vw + 6px), 177px); /* magic number */
}

.footer__robot {
  container-type: size;
}

.footer__eye {
  position: absolute;
  width: 9%;
  height: 5%;
  background-color: black;
  top: 51.9%;
  left: 29%;
  transition: transform 0.05s ease;
  transform: translate(calc((var(--mouse-x-percent) - 50) * 0.04cqw), calc((var(--mouse-y-percent) - 50) * 0.04cqh));
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: inherit;
    rotate: 90deg;
    scale: 1;
    animation: footer-eye-blink 10.27s ease infinite;
  }
}

@keyframes footer-eye-blink {
  0%,
  24.51%,
  25.87%,
  64.68%,
  66.05%,
  67.98%,
  69.35%,
  100% {
    scale: 1;
  }

  25.19%,
  65.37%,
  68.67% {
    scale: 0 1;
  }
}

.footer__eye--left {
  left: 29%;
}

.footer__eye--right {
  left: 62%;
}
</style>

<style>
@keyframes robot-shake {
  0%,
  100% {
    translate: 0 0;
  }
  10% {
    translate: calc(var(--shake-x) * -1) calc(var(--shake-y) * -1);
  }
  20% {
    translate: var(--shake-x) var(--shake-y);
  }
  30% {
    translate: calc(var(--shake-x) * -0.7) calc(var(--shake-y) * 1.3);
  }
  40% {
    translate: calc(var(--shake-x) * 1.2) calc(var(--shake-y) * -0.8);
  }
  50% {
    translate: calc(var(--shake-x) * -1.3) var(--shake-y);
  }
  60% {
    translate: var(--shake-x) calc(var(--shake-y) * -1.5);
  }
  70% {
    translate: calc(var(--shake-x) * -0.5) calc(var(--shake-y) * 0.5);
  }
  80% {
    translate: calc(var(--shake-x) * 1.4) calc(var(--shake-y) * -0.3);
  }
  90% {
    translate: calc(var(--shake-x) * -1) calc(var(--shake-y) * 1.2);
  }
}

.robot-shake-1 {
  --shake-x: 1px;
  --shake-y: 0.5px;
  animation: robot-shake 0.5s ease-in-out infinite;
}

.robot-shake-2 {
  --shake-x: 2.5px;
  --shake-y: 1px;
  animation: robot-shake 0.32s ease-in-out infinite;
}

.robot-shake-3 {
  --shake-x: 5px;
  --shake-y: 2.5px;
  animation: robot-shake 0.18s ease-in-out infinite;
}
</style>
