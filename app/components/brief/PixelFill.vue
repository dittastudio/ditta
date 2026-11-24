<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'

interface Props {
  // 0–1, how far through the brief
  progress: number
  // On Review the bar fills right up, then dissolves away: there's nothing left to fill
  review?: boolean
}

const { progress, review = false } = defineProps<Props>()

// The bar is a grid of accent-coloured cells. Each has a fixed threshold, its column plus a little noise, and is lit once
// progress passes it, so the frontier rests ragged and only ever grows or shrinks. Changes flood in from the edge:
// each cell's turn is mostly its distance past the old edge, partly random, and it flashes bright for a frame or
// two before settling. Cells switch state in whole steps, never fading, so the fill stays pixel-honest.
// A step's flood keeps time with the screen above: it holds while the old step scales out, then floods in on the
// same ease-outCubic as the new one's scale-in, trailing a little past it.
const CELL = 6 // CSS px, snapped to whole device px
const RAGGED = 5 // cells deep the resting edge is jagged
const SCATTER = 0.25 // share of a flood's time that's random rather than edge order
const FLOOD_STRETCH = 1.8 // a step's flood runs this many times the new screen's scale-in (250ms → 450ms)
const FLASH_MS = 80
const REST_ALPHA = 0.25
const FLASH_ALPHA = 1
const FULL_HOLD_MS = 120 // Review holds the full bar this long before it dissolves, so it's seen to be full
const FINALE_OUT_MS = 400
const DRAIN_MS = 700 // matches the reset icon's turn

const OFF = 0
const FLASH = 1
const ON = 2

const canvas = useTemplateRef('canvas')
const reducedMotion = useAtMedia('(prefers-reduced-motion: reduce)')

let ctx: CanvasRenderingContext2D | null = null
let colour = ''
// The step transition's timings, from transitions.css
let stepOut = 150
let stepIn = 250
let cols = 0
let cellPx = 0
let thresholds = new Float32Array(0)
let cells = new Uint8Array(0)
let events: { cell: number; at: number; to: number }[] = []
let finaleTimer: ReturnType<typeof setTimeout> | undefined
let frame = 0
// Set by drain() so the progress dropping to 0 on reset doesn't cut the slower drain short
let draining = false

// The same cell always gets the same noise, so the edge doesn't shuffle on resize or remount
function noise(x: number, y: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

// 0 lights nothing and 1 lights everything, however ragged the edge
const isLit = (threshold: number, level: number) => (level <= 0 ? false : level >= 1 ? true : threshold <= level)

const level = () => (review ? 1 : progress)

function build() {
  const el = canvas.value
  if (!el) return
  const dpr = window.devicePixelRatio || 1
  const { width, height } = el.getBoundingClientRect()
  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)
  cellPx = Math.max(1, Math.round(CELL * dpr))
  cols = Math.ceil(el.width / cellPx)
  const rows = Math.ceil(el.height / cellPx)

  thresholds = new Float32Array(cols * rows)
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) thresholds[r * cols + c] = (c + 0.5 + (noise(c, r) - 0.5) * RAGGED) / cols

  // A rebuild lands at rest: whatever was mid-flood is shown done
  settle(review ? false : level())
}

function settle(target: number | boolean) {
  cancel()
  cells = new Uint8Array(thresholds.length)
  for (let i = 0; i < cells.length; i++)
    cells[i] = (typeof target === 'number' ? isLit(thresholds[i]!, target) : target) ? ON : OFF
  draw()
}

function cancel() {
  events = []
  clearTimeout(finaleTimer)
}

// Inverse of ease-outCubic: when a front moving on that curve reaches `along` of the way
const outCubicAt = (along: number) => 1 - Math.cbrt(1 - along)

// The timing of a step's flood: it starts as the old screen leaves, then trails on past the new one landing, so the
// last cells are still settling just after it.
const stepTiming = () => ({ delay: stepOut, duration: stepIn * FLOOD_STRETCH, curve: outCubicAt })

// Floods the cells that differ from `target` (a level, or true/false for all) and returns when it'll be done
function flood(
  target: number | boolean,
  {
    delay = 0,
    duration = stepIn,
    scatter = SCATTER,
    random = false,
    curve = (along: number) => along,
  }: { delay?: number; duration?: number; scatter?: number; random?: boolean; curve?: (along: number) => number } = {},
) {
  if (reducedMotion.value) {
    settle(target)
    return performance.now()
  }

  cancel()
  const changed: number[] = []
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < cells.length; i++) {
    const want = typeof target === 'number' ? isLit(thresholds[i]!, target) : target
    if ((cells[i] !== OFF) === want) continue
    changed.push(i)
    lo = Math.min(lo, thresholds[i]!)
    hi = Math.max(hi, thresholds[i]!)
  }

  const now = performance.now() + delay
  let end = now
  const span = hi - lo || 1
  for (const cell of changed) {
    const growing = cells[cell] === OFF
    // Growing floods out from the old edge; shrinking drops out from the far edge back
    const along = random ? Math.random() : growing ? (thresholds[cell]! - lo) / span : (hi - thresholds[cell]!) / span
    const at = now + (curve(along) * (1 - scatter) + Math.random() * scatter) * duration
    events.push({ cell, at, to: FLASH }, { cell, at: at + FLASH_MS, to: growing ? ON : OFF })
    end = Math.max(end, at + FLASH_MS)
  }

  run()
  return end
}

// Review: fill right up, hold a beat, then dissolve away
function finale() {
  const filled = flood(1, stepTiming())
  if (reducedMotion.value) return settle(false)

  finaleTimer = setTimeout(
    () => flood(false, { duration: FINALE_OUT_MS, scatter: 1, random: true }),
    filled - performance.now() + FULL_HOLD_MS,
  )
}

// Clearing the brief drains the whole bar from right to left, in time with the reset icon's turn
function drain() {
  draining = true
  flood(false, { duration: DRAIN_MS, scatter: 0.2 })
}

function run() {
  if (!frame) frame = requestAnimationFrame(tick)
}

function tick(now: number) {
  frame = 0
  if (events.length) {
    const due = events.filter((event) => event.at <= now).sort((a, b) => a.at - b.at)
    events = events.filter((event) => event.at > now)
    for (const event of due) cells[event.cell] = event.to
  }

  if (!events.length) draining = false
  if (followingAccent) readColour()
  draw()
  // Idle at rest: the loop only runs while something is still to change
  if (events.length || followingAccent) run()
}

function draw() {
  const el = canvas.value
  if (!ctx || !el) return
  ctx.clearRect(0, 0, el.width, el.height)

  ctx.fillStyle = colour
  for (const [state, alpha] of [
    [ON, REST_ALPHA],
    [FLASH, FLASH_ALPHA],
  ] as const) {
    ctx.globalAlpha = alpha
    ctx.beginPath()
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] !== state) continue
      ctx.rect((i % cols) * cellPx, Math.floor(i / cols) * cellPx, cellPx, cellPx)
    }
    ctx.fill()
  }
}

watch(
  () => [progress, review] as const,
  ([now, isReview], [, wasReview]) => {
    if (isReview) return finale()
    if (draining && now === 0) return
    // Coming back from Review to edit a step is a return, not progress
    if (wasReview) return settle(now)
    flood(now, stepTiming())
  },
)

// '150ms' or '0.15s' to 150, or the fallback if it's unset
function toMs(value: string, fallback: number) {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return fallback
  return value.trim().endsWith('ms') ? n : n * 1000
}

function readColour() {
  if (canvas.value) colour = getComputedStyle(canvas.value).getPropertyValue('--color-accent').trim()
}

// The accent can change at any time, and --color-accent eases between colours on <html> (page.css) rather than
// switching. So the fill follows along, repainting each frame of that transition, and ends on the colour it lands on.
let followingAccent = false
const isAccent = (event: TransitionEvent) =>
  event.target === document.documentElement && event.propertyName === '--color-accent'

function followAccent() {
  followingAccent = true
  run()
}

function stopFollowingAccent() {
  followingAccent = false
  readColour()
  draw()
}

useEventListener(document, 'transitionrun', (event) => isAccent(event) && followAccent())
useEventListener(document, 'transitionend', (event) => isAccent(event) && stopFollowingAccent())
useEventListener(document, 'transitioncancel', (event) => isAccent(event) && stopFollowingAccent())

let observer: ResizeObserver | undefined

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  const styles = getComputedStyle(canvas.value)
  readColour()
  // Mounted while the accent is still easing in, as on first load when the saved accent replaces the default
  const accentEasing = document.documentElement
    .getAnimations()
    .some((animation) => animation instanceof CSSTransition && animation.transitionProperty === '--color-accent')
  if (accentEasing) followAccent()
  stepOut = toMs(styles.getPropertyValue('--brief-step-out'), stepOut)
  stepIn = toMs(styles.getPropertyValue('--brief-step-in'), stepIn)
  observer = new ResizeObserver(build)
  observer.observe(canvas.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
  cancel()
})

defineExpose({ drain })
</script>

<template>
  <canvas
    ref="canvas"
    aria-hidden="true"
    class="block size-full"
  />
</template>
