<script lang="ts" setup>
import type { BlockSteps } from '#storyblok-components'
import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'

interface Props {
  block: BlockSteps
}

const { block } = defineProps<Props>()

const rotation = ref(0)

const onMouseMove = (event: MouseEvent) => {
  rotation.value = (event.clientX / window.innerWidth) * 80 - 40
}

// Mario sprite
const containerRef = ref<HTMLElement | null>(null)
const x = ref(0)
const frame = ref(0)
const facingLeft = ref(false)
const isJumping = ref(false)

const keysHeld = new Set<string>()
let rafId: number | null = null
let lastFrameTime = 0
let velocity = 0
let holdDirection: 'left' | 'right' | null = null
let holdStart = 0
// NES SMB1 walk vs. run accel/max speed (0.037/1.5625 vs 0.055/2.5625 px/frame²), scaled 3x for this sprite
const WALK_SPEED = 4.5
const SPRINT_SPEED = 16
const WALK_ACCEL = 0.111
const SPRINT_ACCEL = 0.164
const DECEL = 0.45
const SKID_DECEL = 0.9
// holding a direction this long transitions from walk into a full sprint, as in the NES version
const SPRINT_HOLD_THRESHOLD = 400
// leg-cycle duration at sprint speed vs. near-standstill — NES animates faster the quicker Mario moves
const MIN_FRAME_DURATION = 16
const MAX_FRAME_DURATION = 200
const SPRITE_SIZE = 48

const marioOuterStyle = computed(() => ({
  transform: `translateX(${x.value}px) scaleX(${facingLeft.value ? -1 : 1})`,
}))

const marioSpriteStyle = computed(
  () =>
    ({
      backgroundImage: `url('/imgs/mario.svg')`,
      backgroundSize: `${SPRITE_SIZE * 5}px ${SPRITE_SIZE}px`,
      backgroundPosition: `${frame.value * -SPRITE_SIZE}px 0`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
    }) as const,
)

const containerWidth = computed(() => containerRef.value?.offsetWidth ?? 0)

const loop = (timestamp: number) => {
  const left = keysHeld.has('ArrowLeft')
  const right = keysHeld.has('ArrowRight')
  const direction = left && !right ? 'left' : right && !left ? 'right' : null

  if (direction !== holdDirection) {
    holdDirection = direction
    holdStart = timestamp
  }

  const sprinting = direction !== null && timestamp - holdStart > SPRINT_HOLD_THRESHOLD
  const maxSpeed = sprinting ? SPRINT_SPEED : WALK_SPEED
  const accel = sprinting ? SPRINT_ACCEL : WALK_ACCEL

  if (direction === 'left') {
    facingLeft.value = true
    // skid harder when reversing out of rightward motion, otherwise accelerate left
    velocity = velocity > 0 ? Math.max(0, velocity - SKID_DECEL) : Math.max(-maxSpeed, velocity - accel)
  } else if (direction === 'right') {
    facingLeft.value = false
    velocity = velocity < 0 ? Math.min(0, velocity + SKID_DECEL) : Math.min(maxSpeed, velocity + accel)
  } else if (velocity > 0) {
    velocity = Math.max(0, velocity - DECEL)
  } else if (velocity < 0) {
    velocity = Math.min(0, velocity + DECEL)
  }

  const nextX = x.value + velocity
  const clampedX = Math.min(Math.max(0, nextX), containerWidth.value - SPRITE_SIZE)
  if (clampedX !== nextX) velocity = 0
  x.value = clampedX

  const speed = Math.abs(velocity)
  const isMoving = speed > 0.05
  const frameDuration = MAX_FRAME_DURATION - (MAX_FRAME_DURATION - MIN_FRAME_DURATION) * (speed / SPRINT_SPEED)

  if (isMoving && !isJumping.value) {
    if (timestamp - lastFrameTime > frameDuration) {
      frame.value = frame.value >= 3 ? 1 : frame.value + 1
      lastFrameTime = timestamp
    }
  } else if (!isJumping.value) {
    frame.value = 0
  }

  rafId = requestAnimationFrame(loop)
}

const onJumpEnd = () => {
  isJumping.value = false
  frame.value = 0
}

const onKeydown = (e: KeyboardEvent) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.key)) return
  e.preventDefault()
  keysHeld.add(e.key)

  if (e.key === 'ArrowUp' && !isJumping.value) {
    isJumping.value = true
    frame.value = 4
  }
}

const onKeyup = (e: KeyboardEvent) => {
  keysHeld.delete(e.key)
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('keyup', onKeyup)
  rafId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('keyup', onKeyup)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div
    v-editable="block"
    class="wrapper flex flex-col gap-[calc(var(--app-gutter-outer)*2)] md:gap-(--app-gutter-outer) overflow-clip"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div class="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-5">
      <UiLockup
        class="col-span-full md:col-span-8"
        :heading="block.heading"
        :copy="block.copy"
      />

      <div class="col-span-full md:col-span-4">
        <IconPixelArrow
          class="animate-bob w-30 md:w-40 ml-auto"
          :style="{ transform: `rotate(${rotation}deg)` }"
        />
      </div>
    </div>

    <div
      ref="containerRef"
      class="relative"
    >
      <div
        class="absolute -top-12 left-0 z-10 pointer-events-none"
        :style="marioOuterStyle"
      >
        <div
          class="w-12 h-12"
          :class="{ 'animate-mario-jump': isJumping }"
          :style="marioSpriteStyle"
          @animationend="onJumpEnd"
        />
      </div>
      <div class="flex flex-col gap-1 rounded-20 squircle-40 overflow-hidden md:-mx-15">
        <div
          v-for="step in block.steps"
          v-editable="step"
          :key="step._uid"
          class="bg-white px-(--app-gutter-outer) py-10 md:px-15 md:py-20 transition-[filter] duration-250 ease-outCubic hover:invert-100"
        >
          <UiStep
            :title="step.title"
            :heading="step.heading"
            :copy="step.copy"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes mario-jump {
  0% {
    translate: 0 0;
    animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  40% {
    translate: 0 -400%;
    animation-timing-function: cubic-bezier(0.55, 0.085, 0.68, 0.53);
  }
  100% {
    translate: 0 0;
  }
}
</style>
