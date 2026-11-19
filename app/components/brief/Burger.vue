<script lang="ts" setup>
import { usePreferredReducedMotion } from '@vueuse/core'
import art from '@/assets/icons/pixel-burger.svg?raw'

// True once the last bite has gone, until the next burger arrives
const finished = defineModel<boolean>('finished', { default: false })

const { width, height, paths, total, remaining, isEmpty, bitesLeft, bite, reset } = useBites(art)

const svg = useTemplateRef('svg')
const canvas = useTemplateRef('canvas')
const crumbs = useCrumbs(canvas)
const reducedMotion = usePreferredReducedMotion()

// Leans towards the mouse, like the footer robot and the services computer. On the wrapper, which stays put while each
// new burger replaces the last, so a fresh one arrives at the same lean.
useMouseTilt(useTemplateRef('tilt'))

// How long the empty plate waits for the next burger: just past the end of funky-s, with sound on or off
const NEXT_BURGER = 4000
// Crumbs shaken loose per bite, and from the last one, which takes the most
const CRUMBS = 9
const LAST_CRUMBS = 16

// A munch for each bite
const munch = defineSample('/sounds/munch.opus')
const funky = defineSample('/sounds/funky-s.opus')
const pacman = defineSample('/sounds/pacman-beginning.opus')
const { isAudioOn } = useAudio()

// Loaded in the order they're needed, and sounds only once audio is on (so a later call still fetches them if it's
// turned on in between). The physics and the munch are needed by the first bite, so they load as the pointer comes
// over the burger. funky-s and the jingle aren't needed until the last bite, so they wait for the first: someone who
// only hovers never fetches them.
let physicsWarm = false
let munchWarm = false
let tunesWarm = false

function warm() {
  if (!physicsWarm && reducedMotion.value !== 'reduce') {
    physicsWarm = true
    crumbs.warm()
  }

  if (!munchWarm && isAudioOn.value) {
    munchWarm = true
    munch.load()
  }
}

function warmTunes() {
  if (tunesWarm || !isAudioOn.value) return
  tunesWarm = true
  funky.load()
  pacman.load()
}

// A touch has no hover to get ahead of the first tap, so on touch screens the warm-up waits for the browser to be idle
onMounted(() => {
  if (!matchMedia('(hover: none)').matches) return
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2000 })
  else setTimeout(warm, 1000)
})

// Squashes a touch with each bite and springs back
const squashed = ref(false)

function squash() {
  if (reducedMotion.value === 'reduce') return
  squashed.value = true
  setTimeout(() => (squashed.value = false), 70)
}

const announcement = ref('')
let nextBurger: ReturnType<typeof setTimeout> | undefined
let funkyStart: ReturnType<typeof setTimeout> | undefined
// Holds a new burger small and see-through for a frame, so it has something to scale and fade in from
const arriving = ref(false)

// Crumbs start where their cell is on screen, tilt and bob included, and fly out the way the bite faced
function shake(removed: { x: number; y: number; color: string }[], direction: { x: number; y: number }, count: number) {
  const matrix = svg.value?.getScreenCTM()
  if (!matrix || reducedMotion.value === 'reduce') return

  const size = Math.hypot(matrix.a, matrix.b)
  const angle = Math.atan2(matrix.b, matrix.a)
  const length = Math.hypot(direction.x, direction.y) || 1
  const out = { x: direction.x / length, y: direction.y / length }
  const sample = [...removed].sort(() => Math.random() - 0.5).slice(0, count)

  crumbs.drop(
    sample.map((cell) => {
      const { x, y } = new DOMPoint(cell.x + 0.5, cell.y + 0.5).matrixTransform(matrix)
      return {
        x,
        y,
        size,
        angle,
        color: cell.color,
        vx: (out.x * 2.5 + (Math.random() - 0.5) * 2) * (size / 5),
        vy: (Math.min(out.y, 0) * 2 - 1.5 - Math.random() * 2) * (size / 5),
      }
    }),
  )
}

function onClick(event: MouseEvent) {
  if (isEmpty.value) return
  warm()

  // A keyboard press clicks with no pointer position: that bite comes from the right
  let at: { x: number; y: number } | undefined
  const matrix = svg.value?.getScreenCTM()

  if (event.detail > 0 && matrix) {
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    at = { x: point.x, y: point.y }
  }

  const { removed, direction } = bite(at)
  if (!removed.length) return

  munch.play()
  warmTunes()
  squash()
  shake(removed, direction, isEmpty.value ? LAST_CRUMBS : CRUMBS)

  if (!isEmpty.value) {
    announcement.value = bitesLeft.value === 1 ? '1 bite left' : `${bitesLeft.value} bites left`
    return
  }

  finished.value = true
  announcement.value = 'Struth! Fancy another...?'
  funkyStart = setTimeout(() => funky.play(), 250) // once the munch has played
  nextBurger = setTimeout(serve, NEXT_BURGER)
}

function serve() {
  funky.stop()
  pacman.play()
  arriving.value = true
  reset()
  finished.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => (arriving.value = false)))
  announcement.value = 'A fresh burger'
}

// The heading's last line changes with `finished`: crumbs resting on the old words settle on the new ones
watch(finished, () => nextTick(crumbs.measure))

// Leaving mid-tune (Start over) cancels what's still to come; defineSample stops whatever's already playing
onBeforeUnmount(() => {
  clearTimeout(nextBurger)
  clearTimeout(funkyStart)
})
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
      @pointerenter="warm"
      @focus="warm"
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

    <Teleport to="body">
      <canvas
        v-if="crumbs.active.value"
        ref="canvas"
        class="pointer-events-none fixed inset-0 z-20 size-full"
        aria-hidden="true"
      />
    </Teleport>
  </div>
</template>
