import { useEventListener } from '@vueuse/core'
import type { Body as MatterBody, Engine as MatterEngine } from 'matter-js'
import type { ShallowRef } from 'vue'

export interface Crumb {
  x: number // centre, in viewport pixels
  y: number
  size: number
  angle: number
  color: string
  vx: number
  vy: number
}

interface Live {
  body: MatterBody
  size: number
  color: string
  restingSince: number // 0 while it's still moving
  fadeFrom: number // 0 until it starts to fade
}

const REST = 2500 // ms a crumb lies still before it fades
const FADE = 400
const MAX = 160 // oldest go first past this, so a frantic eater can't pile up thousands
// Past 2x a phone's canvas costs far more memory than the tiny squares gain in sharpness
const MAX_RATIO = 2

let matter: Promise<typeof import('matter-js')> | null = null
const loadMatter = () => (matter ??= import('matter-js'))

// Lines of text, so crumbs land on the words and not on the empty ends of a centred line. Hidden text is skipped.
function textLines(el: Element) {
  const lines: DOMRect[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const range = document.createRange()

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim() || node.parentElement?.closest('[aria-hidden="true"]')) continue

    range.selectNodeContents(node)

    for (const rect of range.getClientRects()) {
      if (!rect.width) continue
      const line = lines.find((l) => Math.abs(l.top - rect.top) < rect.height / 2)

      if (line) {
        const left = Math.min(line.left, rect.left)
        line.width = Math.max(line.right, rect.right) - left
        line.x = left
      } else {
        lines.push(DOMRect.fromRect(rect))
      }
    }
  }

  // A line box stands well above the letters; crumbs sit on the tops of the lower-case letters instead
  return lines.map((line) => DOMRect.fromRect({ ...line.toJSON(), y: line.y + line.height * 0.3 }))
}

/**
 * Crumbs that fall under gravity onto anything marked `data-crumb-surface`: `text` lands them on each line of words,
 * anything else on the element's box. Drawn on `canvas` (fixed over the viewport), and `active` is true only while
 * there are crumbs to draw. matter-js loads on `warm()`, or with the first crumbs.
 */
export const useCrumbs = (canvas: Readonly<ShallowRef<HTMLCanvasElement | null>>) => {
  const active = ref(false)

  let engine: MatterEngine | null = null
  let lib: typeof import('matter-js') | null = null
  let surfaces: MatterBody[] = []
  let live: Live[] = []
  let context: CanvasRenderingContext2D | null = null
  let ratio = 1
  let raf = 0
  let last = 0
  let scrollY = 0
  let measuring = 0
  // Whether the last frame drew anything that has changed since: while every crumb lies still, frames skip the draw
  let settled = false

  const warm = () => {
    loadMatter().catch(() => {})
  }

  function measure() {
    if (!engine || !lib) return
    settled = false
    const { Bodies, Composite, Sleeping } = lib

    Composite.remove(engine.world, surfaces)

    surfaces = [...document.querySelectorAll<HTMLElement>('[data-crumb-surface]')].flatMap((el) =>
      (el.dataset.crumbSurface === 'text' ? textLines(el) : [el.getBoundingClientRect()]).map((rect) =>
        Bodies.rectangle(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height, {
          isStatic: true,
          friction: 0.6,
        }),
      ),
    )

    Composite.add(engine.world, surfaces)
    // Anything resting where a surface has gone falls again
    live.forEach(({ body }) => Sleeping.set(body, false))
  }

  // Scroll and resize can fire many times a frame; the surfaces are measured once, on the next frame
  function measureSoon() {
    settled = false
    if (!measuring) {
      measuring = requestAnimationFrame(() => {
        measuring = 0
        measure()
      })
    }
  }

  // Crumbs live in viewport space, so scrolling carries them with the page they're lying on
  function onScroll() {
    if (!lib) return
    const dy = window.scrollY - scrollY
    scrollY = window.scrollY
    live.forEach(({ body }) => lib!.Body.translate(body, { x: 0, y: -dy }))
    measureSoon()
  }

  useEventListener(() => (active.value ? window : null), 'scroll', onScroll, { passive: true })
  useEventListener(
    () => (active.value ? window : null),
    'resize',
    () => {
      size()
      measureSoon()
    },
    { passive: true },
  )

  function size() {
    const el = canvas.value
    if (!el) return
    ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO)
    el.width = window.innerWidth * ratio
    el.height = window.innerHeight * ratio
    context = el.getContext('2d')
    settled = false
  }

  function draw(now: number) {
    if (!context) return

    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)

    for (const crumb of live) {
      const { position, angle } = crumb.body
      const cos = Math.cos(angle) * ratio
      const sin = Math.sin(angle) * ratio
      // One transform per crumb (scale, turn, place) instead of a save, translate, rotate and restore
      context.setTransform(cos, sin, -sin, cos, position.x * ratio, position.y * ratio)
      context.globalAlpha = crumb.fadeFrom ? Math.max(0, 1 - (now - crumb.fadeFrom) / FADE) : 1
      context.fillStyle = crumb.color
      context.fillRect(-crumb.size / 2, -crumb.size / 2, crumb.size, crumb.size)
    }

    context.globalAlpha = 1
  }

  function tick(now: number) {
    if (!engine || !lib) return

    // A hidden tab stops frames; the cap stops the world leaping forward when it comes back
    lib.Engine.update(engine, Math.min(now - last, 32))
    last = now

    const gone: Live[] = []
    let changed = false

    for (const crumb of live) {
      const { body } = crumb
      const still = body.isSleeping || body.speed < 0.05
      if (!body.isSleeping || crumb.fadeFrom) changed = true

      if (body.position.y > window.innerHeight + 40) gone.push(crumb)
      else if (crumb.fadeFrom && now - crumb.fadeFrom > FADE) gone.push(crumb)
      else if (!still) crumb.restingSince = 0
      else if (!crumb.restingSince) crumb.restingSince = now
      else if (!crumb.fadeFrom && now - crumb.restingSince > REST) crumb.fadeFrom = now
    }

    if (gone.length) {
      lib.Composite.remove(
        engine.world,
        gone.map((crumb) => crumb.body),
      )
      live = live.filter((crumb) => !gone.includes(crumb))
    }

    // Once everything has landed, frames carry on (to count down to the fade) without redrawing a still picture
    if (changed || gone.length || !settled) draw(now)
    settled = !changed && !gone.length

    if (live.length) raf = requestAnimationFrame(tick)
    else stop()
  }

  function stop() {
    cancelAnimationFrame(raf)
    cancelAnimationFrame(measuring)
    raf = 0
    measuring = 0
    context = null
    active.value = false
  }

  async function drop(crumbs: Crumb[]) {
    if (!crumbs.length) return

    lib = await loadMatter()
    const { Bodies, Body, Composite, Engine } = lib

    if (!engine) engine = Engine.create({ gravity: { x: 0, y: 1 }, enableSleeping: true })

    if (!active.value) {
      active.value = true
      await nextTick() // the canvas mounts with `active`
      scrollY = window.scrollY
      size()
      measure()
    }

    const bodies = crumbs.map((crumb) => {
      const body = Bodies.rectangle(crumb.x, crumb.y, crumb.size, crumb.size, {
        angle: crumb.angle,
        restitution: 0.35,
        friction: 0.4,
        frictionAir: 0.015,
        // Crumbs only land on surfaces, never on each other: a pile of them would just look like a smudge
        collisionFilter: { group: -1 },
      })
      Body.setVelocity(body, { x: crumb.vx, y: crumb.vy })
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4)
      return body
    })

    Composite.add(engine.world, bodies)
    settled = false
    live.push(
      ...bodies.map((body, i) => ({
        body,
        size: crumbs[i]!.size,
        color: crumbs[i]!.color,
        restingSince: 0,
        fadeFrom: 0,
      })),
    )

    const extra = live.length - MAX
    if (extra > 0) {
      Composite.remove(
        engine.world,
        live.slice(0, extra).map((crumb) => crumb.body),
      )
      live = live.slice(extra)
    }

    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
  }

  onScopeDispose(() => {
    cancelAnimationFrame(raf)
    cancelAnimationFrame(measuring)
    if (engine && lib) lib.Engine.clear(engine)
    engine = null
    live = []
  })

  return { active, warm, drop, measure }
}
