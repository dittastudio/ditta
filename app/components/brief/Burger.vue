<script lang="ts" setup>
import { usePreferredReducedMotion } from '@vueuse/core'
import art from '@/assets/icons/pixel-burger.svg?raw'

// True once the last bite has gone, until the next burger arrives
const finished = defineModel<boolean>('finished', { default: false })

const { width, height, paths, total, remaining, isEmpty, bitesLeft, bite, reset } = useBites(art)

const svg = useTemplateRef('svg')
const reducedMotion = usePreferredReducedMotion()

// Leans towards the mouse, like the footer robot and the services computer. On the wrapper, which stays put while each
// new burger replaces the last, so a fresh one arrives at the same lean.
useMouseTilt(useTemplateRef('tilt'))

// How long the empty plate waits for the next burger
const NEXT_BURGER = 4000

// Squashes a touch with each bite and springs back
const squashed = ref(false)

function squash() {
  if (reducedMotion.value === 'reduce') return
  squashed.value = true
  setTimeout(() => (squashed.value = false), 70)
}

const announcement = ref('')
let nextBurger: ReturnType<typeof setTimeout> | undefined
// Holds a new burger small and see-through for a frame, so it has something to scale and fade in from
const arriving = ref(false)

function onClick(event: MouseEvent) {
  if (isEmpty.value) return

  // A keyboard press clicks with no pointer position: that bite comes from the right
  let at: { x: number; y: number } | undefined
  const matrix = svg.value?.getScreenCTM()

  if (event.detail > 0 && matrix) {
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    at = { x: point.x, y: point.y }
  }

  const { removed } = bite(at)
  if (!removed.length) return

  squash()

  if (!isEmpty.value) {
    announcement.value = bitesLeft.value === 1 ? '1 bite left' : `${bitesLeft.value} bites left`
    return
  }

  finished.value = true
  announcement.value = 'Struth! Fancy another...?'
  nextBurger = setTimeout(serve, NEXT_BURGER)
}

function serve() {
  arriving.value = true
  reset()
  finished.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => (arriving.value = false)))
  announcement.value = 'A fresh burger'
}

onBeforeUnmount(() => clearTimeout(nextBurger))
</script>

<template>
  <!-- Set further apart than the text below it: the bob carries the burger 30px down towards the heading -->
  <div class="relative isolate grid place-items-center animate-bob mb-10 md:mb-15">
    <!-- A soft light breathing behind the burger, dimming as it's eaten. Held still for reduced motion. -->
    <div
      class="pointer-events-none absolute -inset-15 -z-10 transition-opacity duration-700 ease-outCubic md:-inset-20"
      :style="{ opacity: remaining / total }"
      aria-hidden="true"
    >
      <div class="size-full bg-radial from-accent/50 to-transparent to-70% animate-glow motion-reduce:animate-none" />
    </div>

    <button
      type="button"
      class="rounded-10 focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-8 focus-visible:outline-white/50"
      :class="isEmpty ? 'cursor-default' : 'cursor-pointer'"
      :aria-disabled="isEmpty"
      aria-label="Take a bite"
      @click="onClick"
    >
      <!-- Tilt and squash are separate properties (rotate, scale), so neither undoes the other -->
      <span
        ref="tilt"
        class="block rotate-(--tilt) transition-[scale]"
        :class="squashed ? 'scale-96 duration-75 ease-outCubic' : 'duration-300 ease-outBack'"
      >
        <!-- 30 art pixels wide, so 4 and 6 screen pixels to each keeps the edges crisp. A new burger scales and fades
             in from just under full size; for reduced motion it only fades. -->
        <svg
          ref="svg"
          :viewBox="`0 0 ${width} ${height}`"
          shape-rendering="crispEdges"
          class="block w-30 md:w-45"
          :class="
            arriving
              ? 'scale-90 opacity-0 motion-reduce:scale-100'
              : 'transition-[opacity,scale] duration-500 ease-outBack'
          "
          aria-hidden="true"
        >
          <path
            v-for="path in paths"
            :key="path.fill"
            :fill="path.fill"
            :d="path.d"
          />
        </svg>
      </span>
    </button>

    <p
      class="sr-only"
      role="status"
    >
      {{ announcement }}
    </p>
  </div>
</template>
