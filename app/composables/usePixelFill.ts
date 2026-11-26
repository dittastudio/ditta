import { useResizeObserver } from '@vueuse/core'
import type { ShallowRef } from 'vue'

interface PixelFillLayers {
  // The option, which sets the grid's size
  root: Readonly<ShallowRef<HTMLElement | null>>
  // The accent
  fill: Readonly<ShallowRef<HTMLElement | null>>
  // The white text, shown wherever the fill isn't
  content: Readonly<ShallowRef<HTMLElement | null>>
  // A black copy of the text, shown wherever it is
  ink: Readonly<ShallowRef<HTMLElement | null>>
}

interface Point {
  x: number
  y: number
}

// A picked option fills with accent pixels spreading out from where it was tapped. The option is a grid of cells, each
// lit at its distance from that point, plus optional noise so the front is ragged, plus a little chance, on an
// ease-outCubic front. A cell switches in whole steps, never fading. The text turns black cell by cell: a black copy of it shows through the lit cells, the white through the rest. Unpicking dissolves
// the cells at random, quicker than the fill. Tuned in the Pixel Pick playground.
const CELL = 8 // CSS px
const RAGGED = 0 // cells deep the front is jagged
const SCATTER = 0.25 // share of a cell's timing that's random rather than distance
const FILL_MS = 750
const EMPTY_RATIO = 0.5 // unpicking runs this share of the fill

const OFF = 0
const ON = 1

// When a front moving on ease-outCubic reaches `along` of the way
const outCubicAt = (along: number) => 1 - Math.cbrt(1 - along)

export default function usePixelFill({ root, fill, content, ink }: PixelFillLayers) {
  const reducedMotion = useAtMedia('(prefers-reduced-motion: reduce)')

  let width = 0
  let height = 0
  let cols = 0
  let rows = 0
  let on = false
  // Each cell goes from `from` to `to` at `at`
  let from = new Uint8Array(0)
  let to = new Uint8Array(0)
  let at = new Float64Array(0)
  let states = new Uint8Array(0)
  let endAt = 0
  let frame = 0

  const stateAt = (i: number, now: number) => (now < at[i]! ? from[i]! : to[i]!)

  function build(w: number, h: number) {
    width = w
    height = h
    cols = Math.ceil(width / CELL)
    rows = Math.ceil(height / CELL)
    const n = cols * rows
    from = new Uint8Array(n)
    to = new Uint8Array(n)
    at = new Float64Array(n)
    states = new Uint8Array(n)
    settle()
  }

  // Lands at rest: whatever was mid-fill is shown done
  function settle() {
    cancelAnimationFrame(frame)
    frame = 0
    from.fill(on ? ON : OFF)
    to.fill(on ? ON : OFF)
    at.fill(0)
    endAt = 0
    render(performance.now())
  }

  // Sends every cell not already headed for `target` there, picking up from wherever each one is, so a pick can be
  // undone mid-fill. With a point the cells go out from it; without, they go at random.
  function flood(target: number, point?: Point) {
    const now = performance.now()
    const filling = target === ON
    const duration = filling ? FILL_MS : FILL_MS * EMPTY_RATIO
    const reach = point
      ? Math.max(
          Math.hypot(point.x, point.y),
          Math.hypot(width - point.x, point.y),
          Math.hypot(point.x, height - point.y),
          Math.hypot(width - point.x, height - point.y),
        )
      : 1

    const changed: number[] = []
    const along: number[] = []
    let lo = Infinity
    let hi = -Infinity
    for (let i = 0; i < from.length; i++) {
      const heading = stateAt(i, now)
      from[i] = heading
      to[i] = target
      at[i] = 0
      if (heading === target) continue

      let a = Math.random()
      if (point) {
        const x = ((i % cols) + 0.5) * CELL
        const y = (Math.floor(i / cols) + 0.5) * CELL
        a = (Math.hypot(x - point.x, y - point.y) + (Math.random() - 0.5) * RAGGED * CELL) / reach
      }
      changed.push(i)
      along.push(a)
      lo = Math.min(lo, a)
      hi = Math.max(hi, a)
    }

    const span = hi - lo || 1
    changed.forEach((i, k) => {
      at[i] = now + (outCubicAt((along[k]! - lo) / span) * (1 - SCATTER) + Math.random() * SCATTER) * duration
      endAt = Math.max(endAt, at[i]!)
    })

    if (!frame) frame = requestAnimationFrame(tick)
  }

  function tick(now: number) {
    frame = 0
    render(now)
    if (now < endAt) frame = requestAnimationFrame(tick)
  }

  // A rect per run of matching cells along each row
  function path(match: number) {
    let d = ''
    for (let r = 0; r < rows; r++) {
      let c = 0
      while (c < cols) {
        if (states[r * cols + c] !== match) {
          c++
          continue
        }
        const start = c
        while (c < cols && states[r * cols + c] === match) c++
        d += `M${start * CELL} ${r * CELL}h${(c - start) * CELL}v${CELL}h${-(c - start) * CELL}z`
      }
    }
    return d
  }

  function render(now: number) {
    if (!fill.value || !content.value || !ink.value) return
    // The classes that show a picked option before mount are overruled from here on
    content.value.style.visibility = 'visible'

    // With reduced motion it's a plain fade between the two
    if (reducedMotion.value) {
      fill.value.style.visibility = 'visible'
      fill.value.style.clipPath = 'none'
      fill.value.style.opacity = on ? '1' : '0'
      content.value.style.clipPath = 'none'
      content.value.style.color = on ? 'var(--color-black)' : ''
      ink.value.style.visibility = 'hidden'
      return
    }

    let lit = 0
    for (let i = 0; i < states.length; i++) {
      states[i] = stateAt(i, now)
      if (states[i] === ON) lit++
    }
    const none = lit === 0
    const all = lit === states.length
    const litPath = none || all ? '' : path(ON)

    fill.value.style.opacity = ''
    fill.value.style.visibility = none ? 'hidden' : 'visible'
    fill.value.style.clipPath = litPath ? `path('${litPath}')` : 'none'

    ink.value.style.visibility = none ? 'hidden' : 'visible'
    ink.value.style.clipPath = litPath ? `path('${litPath}')` : 'none'

    content.value.style.color = ''
    content.value.style.clipPath = all
      ? 'inset(50%)'
      : litPath
        ? `path(evenodd, 'M0 0H${width}V${height}H0z${litPath}')`
        : 'none'
  }

  function set(value: boolean, point?: Point) {
    if (value === on) return
    on = value
    if (reducedMotion.value) return render(performance.now())
    if (!on) return flood(OFF)
    flood(ON, point ?? { x: width / 2, y: height / 2 })
  }

  // Starts at rest in whatever state it mounts in
  function init(value: boolean) {
    on = value
  }

  // Built from the observer's size, which it reports after layout, rather than read from the option. Every option on
  // a question measures as it mounts and on each resize, so reading would force a layout per option. The first
  // report comes before the first paint, so the grid is built in time for it.
  useResizeObserver(root, ([entry]) => {
    const size = entry?.borderBoxSize[0]
    if (size && (size.inlineSize !== width || size.blockSize !== height)) build(size.inlineSize, size.blockSize)
  })

  watch(reducedMotion, settle)

  onBeforeUnmount(() => cancelAnimationFrame(frame))

  return { init, set }
}
