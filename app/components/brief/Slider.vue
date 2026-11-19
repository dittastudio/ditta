<script lang="ts" setup>
import { useElementSize, usePreferredReducedMotion, useRafFn } from '@vueuse/core'
import { defineSound } from '@web-kits/audio'
import { spring as springSound } from '@@/.web-kits/core'

// Attributes (aria-labelledby, aria-describedby) belong on the range input, not the wrapper
defineOptions({ inheritAttrs: false })

interface Props {
  options: readonly string[]
  initial?: string
}

const { options, initial } = defineProps<Props>()
const model = defineModel<string | undefined>()

// A slider with an `initial` option starts on it, already chosen, so it can be accepted as it is
if (initial && !(model.value && options.includes(model.value)) && options.includes(initial)) model.value = initial

const last = computed(() => options.length - 1)

// Otherwise starts with nothing chosen, so the answer is one someone actually picked rather than wherever the handle
// began (see docs/plans/brief-builder-flow.md, screen 3)
const chosen = computed(() => (model.value && options.includes(model.value) ? options.indexOf(model.value) : -1))

const track = useTemplateRef('track')
const { width } = useElementSize(track)
const reducedMotion = usePreferredReducedMotion()
const still = computed(() => reducedMotion.value === 'reduce')

// The handle is a blob on a rubber band. Dragging pulls it slightly out of shape and only gives a little ground; past
// halfway it lets go and glides to the next band with a touch of overshoot. Two springs, one for where it is and one for
// its shape, both always running while it's held, so every motion flows into the next with no hand-overs.
const RESISTANCE = 0.2 // how far the handle follows the pointer within a band
const PULL = 0.55 // how much it stretches towards the pointer while held
const SPEED_STRETCH = 0.045 // how much it stretches with speed in flight
const MAX_STRETCH = 0.18
const MOVE = { stiffness: 500, damping: 26 } // under-damped (ζ ≈ 0.58): a small overshoot, then settles
const SHAPE = { stiffness: 800, damping: 26 } // ζ ≈ 0.46, so the shape gives a little wobble as it lands

interface Spring {
  value: number
  velocity: number
}

// One step of a damped spring towards `goal` (semi-implicit Euler)
function stepSpring(spring: Spring, goal: number, { stiffness, damping }: typeof MOVE, dt: number) {
  spring.velocity += (-stiffness * (spring.value - goal) - damping * spring.velocity) * dt
  spring.value += spring.velocity * dt
}

const isSettled = (spring: Spring, goal: number, near: number, slow: number) =>
  Math.abs(spring.value - goal) < near && Math.abs(spring.velocity) < slow

const clamp = (value: number, max: number) => Math.min(Math.max(value, -max), max)

// Where the handle is, in bands (0 to last), and how stretched it is: positive leans right, negative leans left. The
// springs do the maths; the refs are what gets drawn.
const position = ref(Math.max(chosen.value, 0))
const stretch = ref(0)
const move: Spring = { value: position.value, velocity: 0 }
const shape: Spring = { value: 0, velocity: 0 }
let target = position.value
let moving = false
let pull = 0

const { pause, resume, isActive } = useRafFn(({ delta }) => tick(Math.min(delta / 1000, 1 / 30)), { immediate: false })

function tick(dt: number) {
  if (moving) {
    stepSpring(move, target, MOVE, dt)

    if (isSettled(move, target, 0.0005, 0.005)) {
      move.value = target
      move.velocity = 0
      moving = false
    }

    position.value = move.value
  }

  // Both pulls act at once, so there's never a hand-over between them: its own speed stretches it along its path, and
  // the pointer's tension stretches it towards the finger. Let go and both fade, and it rounds out. The tension only
  // counts while a drag is live, so however a drag ends, the shape can never be left held out of round.
  const goal = clamp(move.velocity * SPEED_STRETCH + (dragging.value ? pull * PULL : 0), MAX_STRETCH)
  stepSpring(shape, goal, SHAPE, dt)

  if (!moving && isSettled(shape, goal, 0.001, 0.01)) {
    shape.value = goal
    shape.velocity = 0
    pause()
  }

  stretch.value = shape.value
}

// A spring each time the handle snaps to a new band, by drag, tap or key. Not when the answer is set from outside.
const soundSpring = defineSound(springSound)
const { play } = useAudio()
let landed = position.value

function snap(index: number) {
  if (index === landed) return
  landed = index
  play(soundSpring)
}

// Puts the handle straight at `index`, still and round
function place(index: number) {
  landed = index
  pause()
  moving = false
  pull = 0
  position.value = move.value = target = index
  move.velocity = 0
  stretch.value = shape.value = shape.velocity = 0
}

// Moves the handle to `to`, always on the spring. Even a small move within a band is the mass being tugged, so a snap
// to the next band is just a bigger tug on the same body, and there's nothing to hand over when it lands.
function moveTo(to: number) {
  if (still.value) return place(to)
  target = to
  moving = true
  resume()
}

function setPull(value: number) {
  if (still.value) return
  pull = value
  resume()
}

function choose(index: number) {
  snap(index)
  model.value = options[index]
  setPull(0)
  moveTo(index)
}

// Pointer: a drag or a tap both settle on a band when let go
let pressed = false
const dragging = ref(false)
const band = ref(0)
let startX = 0
// Measured once when pressed, rather than on every move of a drag. Only its horizontal edges are read, which
// scrolling the page up and down doesn't move.
let trackRect: DOMRect | undefined

// The handle's centre stops half its width (12px) in from each end of the track
function positionAt(clientX: number) {
  const rect = trackRect ?? track.value!.getBoundingClientRect()
  const ratio = (clientX - rect.left - 12) / (rect.width - 24)
  return Math.min(Math.max(ratio, 0), 1) * last.value
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  track.value!.setPointerCapture(event.pointerId)
  pressed = true
  startX = event.clientX
  trackRect = track.value!.getBoundingClientRect()
}

function onPointerMove(event: PointerEvent) {
  if (!pressed) return
  if (!dragging.value && Math.abs(event.clientX - startX) < 4) return

  if (!dragging.value) {
    dragging.value = true
    band.value = Math.round(position.value)
  }

  const raw = positionAt(event.clientX)
  const nearest = Math.round(raw)
  const offset = raw - nearest

  band.value = nearest
  snap(nearest)
  setPull(offset)
  moveTo(nearest + offset * RESISTANCE)
}

// Every way a press can end comes through here: let go, cancelled, or capture lost (a quick release outside the
// slider or the window can drop capture before pointerup arrives). The first one settles it; the rest do nothing.
function release(event: PointerEvent) {
  if (!pressed) return
  pressed = false

  if (dragging.value) choose(band.value)
  else if (event.type === 'pointerup') choose(Math.round(positionAt(event.clientX)))

  dragging.value = false
  trackRect = undefined
  resume() // make sure the shape gets a frame to round out, whatever state the loop was left in
}

// Keyboard and screen readers go through the native input, one band at a time, with no animation
function onInput(event: Event) {
  const index = Number((event.target as HTMLInputElement).value)
  snap(index)
  place(index)
  model.value = options[index]
}

// With nothing chosen the native input still sits at the first band, so Left or Home wouldn't move it and the first
// band could only be reached by going right and back. Any of them picks it instead.
function onKeydown(event: KeyboardEvent) {
  if (chosen.value !== -1 || !['ArrowLeft', 'ArrowDown', 'Home', 'PageDown'].includes(event.key)) return
  event.preventDefault()
  snap(0)
  place(0)
  model.value = options[0]
}

// Keep the handle in step when the answer changes from outside (Start again, a restored draft)
watch(chosen, (index) => {
  if (!dragging.value && !isActive.value) place(Math.max(index, 0))
})

// The band the handle is on: live while dragging, otherwise the answer
const shown = computed(() => (dragging.value ? band.value : chosen.value))

// A band's spot along the track, matching where the handle's centre stops
const at = (index: number) => `calc(var(--spacing) * 3 + ${index / last.value} * (100% - var(--spacing) * 6))`

// Drawn with transforms only. The handle's centre in px, then stretched one-sided: it grows towards the lean and keeps
// roughly its area by thinning, while the trailing edge stays put.
const handleX = computed(() => 12 + (position.value / last.value) * Math.max(width.value - 24, 0))

const handleStyle = computed(() => {
  const amount = Math.abs(stretch.value)
  return {
    transform: `translate(${handleX.value - 12 + stretch.value * 12}px, -50%) scale(${1 + amount}, ${1 / Math.sqrt(1 + amount)})`,
  }
})

// The track runs between the first and last stops, so the fill is just how far along the stops the handle is
const fillStyle = computed(() => ({ transform: `scaleX(${Math.min(Math.max(position.value / last.value, 0), 1)})` }))
</script>

<template>
  <div class="@container flex flex-col gap-6">
    <p
      class="text-40 leading-none trim-both md:text-64"
      :class="{ 'text-beige': shown === -1 }"
      aria-hidden="true"
    >
      {{ shown === -1 ? 'Drag to choose' : options[shown] }}
    </p>

    <div
      ref="track"
      class="relative -my-2 h-20 cursor-pointer touch-pan-y select-none"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="release"
      @pointercancel="release"
      @lostpointercapture="release"
    >
      <input
        v-bind="$attrs"
        :value="Math.max(chosen, 0)"
        type="range"
        min="0"
        :max="last"
        step="1"
        :aria-valuetext="chosen === -1 ? 'Not chosen yet' : options[chosen]"
        class="peer pointer-events-none absolute inset-0 size-full opacity-0"
        @input="onInput"
        @keydown="onKeydown"
      />

      <div class="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-graphite">
        <div
          class="h-full origin-left bg-coral"
          :style="fillStyle"
        />
      </div>

      <!-- A dot at each stop, so the scale reads as stepped even when only its ends are labelled -->
      <span
        v-for="(option, i) in options"
        :key="option"
        class="absolute top-1/2 size-1.5 -translate-1/2 rounded-full"
        :class="i <= position ? 'bg-coral' : 'bg-graphite'"
        :style="{ left: at(i) }"
        aria-hidden="true"
      />

      <div
        class="absolute top-1/2 left-0 size-6 rounded-full bg-coral outline-offset-6 outline-white/50 will-change-transform peer-focus-visible:outline-1 peer-focus-visible:outline-dashed"
        :style="handleStyle"
      />
    </div>

    <!-- On a narrow slider only the ends are labelled: the readout above names the value, and the dots show the stops -->
    <div
      class="relative h-5 text-14 leading-tight text-beige"
      aria-hidden="true"
    >
      <span
        v-for="(option, i) in options"
        :key="option"
        class="absolute top-0 whitespace-nowrap"
        :class="i === 0 ? 'left-0' : i === last ? 'right-0' : 'hidden -translate-x-1/2 @sm:block'"
        :style="i === 0 || i === last ? undefined : { left: at(i) }"
      >
        {{ option }}
      </span>
    </div>
  </div>
</template>
