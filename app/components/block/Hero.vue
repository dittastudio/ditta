<script lang="ts" setup>
import type { Block } from '#storyblok-schema'
import { onKeyStroke, useIntersectionObserver, useResizeObserver } from '@vueuse/core'
import { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } from 'matter-js'
import type { IEventCollision } from 'matter-js'
import { defineSound } from '@web-kits/audio'
import { kick, snare, hatClosed, tom } from '@@/.web-kits/drums'
import { useAppStore } from '@/stores/app'
import IconSmiley from '@/assets/icons/pixel-smiley.svg'

interface Props {
  block: Block<'block_hero'>
}

defineProps<Props>()

const { play, isAudioOn } = useAudio()
const appStore = useAppStore()

const kickSound = defineSound(kick)
const snareSound = defineSound(snare)
const hatSound = defineSound(hatClosed)
const tomSound = defineSound(tom)

const dEl = ref<SVGPathElement | null>(null)
const iEl = ref<SVGElement | null>(null)
const iDotEl = ref<SVGPathElement | null>(null)
const iStemEl = ref<SVGPathElement | null>(null)
const tEl = ref<SVGPathElement | null>(null)
const aEl = ref<SVGPathElement | null>(null)

const wrapperEl = ref<HTMLElement | null>(null)
const smileyEl = ref<HTMLElement | null>(null)
const smileySpinEl = ref<HTMLElement | null>(null)
const logoEl = ref<SVGSVGElement | null>(null)

const SMILEY_SPEED = 160 // px/second
const SMILEY_SPIN_SPEED_MIN = 10 // deg/second
const SMILEY_SPIN_SPEED_MAX = 120 // deg/second
const SMILEY_FLING_SPEED_MULTIPLIER_MAX = 5 // cap on release speed, as a multiple of SMILEY_SPEED
const SMILEY_DECAY_DURATION = 5 // seconds for fling speed to blend back to SMILEY_SPEED
const SMILEY_DECAY_SNAP_THRESHOLD = 4 // px/second; end decay early once this close to SMILEY_SPEED
const SMILEY_WALL_PAD = 100 // px, wall body thickness/offset around the hero bounds
const SMILEY_VELOCITY_UNIT = 60 // matter-js normalises body.velocity to px per (1000/60)ms — multiply by this for px/second
const SMILEY_MAX_DT = 0.1 // seconds; clamp a stale/backgrounded-tab frame gap so matter-js's velocity
// correction (proportional to how much the new delta differs from the last one) can't spike and tunnel the body through a wall in one step
const SMILEY_PHYSICS_STEP = 1000 / 60 // ms; matter-js's recommended max delta per Engine.update — longer frames are split into sub-steps
const SMILEY_WALL_CATEGORY = 0x0002 // collision category so wall collision can be toggled off while dragging

// Per-frame state is deliberately non-reactive: the transforms are written straight to the DOM in
// applySmileyTransform, so the rAF loop never re-runs this component's render (and its logo SVG diff).
const smileyCenter = { x: 0, y: 0 } // px, relative to wrapperEl — mirrors smileyBody.position
let smileyRadius = 0
let smileyRotation = 0
const heroBounds = { width: 0, height: 0 }

interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

interface LogoLetter {
  rect: Rect // combined bounding box, used as a cheap broad-phase check before the exact shape test
  paths: Path2D[] // in the SVG's viewBox coordinates
}

// Maps wrapper-relative px into the logo SVG's viewBox coordinates. Wrapper-relative (rather than
// client) coordinates don't shift when the page scrolls, so this only needs refreshing on resize.
const logoViewBox = { left: 0, top: 0, scaleX: 1, scaleY: 1, originX: 0, originY: 0 }
let hitTestContext: CanvasRenderingContext2D | null = null // offscreen, only used for isPointInPath

const SMILEY_SAMPLE_COUNT = 20 // points sampled around the circle's edge for shape hit-testing
const SMILEY_PUSH_STEP = 3 // px/frame nudge to push the circle back out of a letter it's touching

const smileyReady = ref(false)
const isDraggingSmiley = ref(false)
const canDragSmiley = useAtMedia('(pointer: fine)')

let logoLetters: LogoLetter[] = []
let activeLetterIndex: number | null = null
let smileyRafId: number | null = null
let smileyLastTime = 0
let smileySpinDirection = 1 // 1 = clockwise, -1 = counter-clockwise
let smileySpinSpeed = SMILEY_SPIN_SPEED_MIN // deg/second, randomised on each bounce
let smileyDecayElapsed: number | null = null // seconds since a fling release, null when not decaying
let wallBounceThisFrame = false

let engine: Engine | null = null
let smileyBody: Body | null = null
let smileyWalls: Body[] = []
let mouseConstraint: MouseConstraint | null = null

const applySmileyTransform = () => {
  if (smileyEl.value) {
    smileyEl.value.style.transform = `translate3d(${smileyCenter.x - smileyRadius}px, ${smileyCenter.y - smileyRadius}px, 0)`
  }

  if (smileySpinEl.value) smileySpinEl.value.style.transform = `rotate(${smileyRotation}deg)`
}

const hit = (el: typeof dEl, cls = 'is-hit') => {
  if (!el.value) return

  el.value.classList.remove(cls)
  void el.value.getBoundingClientRect()
  el.value.classList.add(cls)
}

const playD = () => {
  if (!isAudioOn.value) return

  play(kickSound)
  hit(dEl, 'is-d-hit')
}

const playI = () => {
  if (!isAudioOn.value) return

  play(snareSound)
  hit(iEl, 'is-i-hit')
}

const playT = () => {
  if (!isAudioOn.value) return

  play(hatSound)
  hit(tEl, 'is-t-hit')
}

const playA = () => {
  if (!isAudioOn.value) return

  play(tomSound)
  hit(aEl, 'is-a-hit')
}

onKeyStroke(['d', 'D'], playD)
onKeyStroke(['i', 'I'], playI)
onKeyStroke(['t', 'T'], playT)
onKeyStroke(['a', 'A'], playA)

const measureSmileyBounds = () => {
  if (!wrapperEl.value || !smileyEl.value) return

  const wrapperRect = wrapperEl.value.getBoundingClientRect()
  heroBounds.width = wrapperRect.width
  heroBounds.height = wrapperRect.height

  const smileyRect = smileyEl.value.getBoundingClientRect()
  smileyRadius = smileyRect.width / 2

  if (logoEl.value) {
    const logoRect = logoEl.value.getBoundingClientRect()
    const viewBox = logoEl.value.viewBox.baseVal
    logoViewBox.left = logoRect.left - wrapperRect.left
    logoViewBox.top = logoRect.top - wrapperRect.top
    logoViewBox.scaleX = viewBox.width / logoRect.width
    logoViewBox.scaleY = viewBox.height / logoRect.height
    logoViewBox.originX = viewBox.x
    logoViewBox.originY = viewBox.y
  }

  const letterGroups: (SVGPathElement | null)[][] = [
    [dEl.value],
    [iDotEl.value, iStemEl.value],
    [tEl.value],
    [aEl.value],
  ]

  logoLetters = letterGroups
    .map((group) => group.filter((path): path is SVGPathElement => !!path))
    .filter((paths) => paths.length > 0)
    .map((paths) => {
      let left = Infinity
      let top = Infinity
      let right = -Infinity
      let bottom = -Infinity

      for (const path of paths) {
        const pathRect = path.getBoundingClientRect()
        left = Math.min(left, pathRect.left)
        top = Math.min(top, pathRect.top)
        right = Math.max(right, pathRect.right)
        bottom = Math.max(bottom, pathRect.bottom)
      }

      return {
        paths: paths.map((path) => new Path2D(path.getAttribute('d') ?? '')),
        rect: {
          left: left - wrapperRect.left,
          top: top - wrapperRect.top,
          right: right - wrapperRect.left,
          bottom: bottom - wrapperRect.top,
        },
      }
    })
}

const clampSmileyPosition = () => {
  const r = smileyRadius
  const maxX = Math.max(r, heroBounds.width - r)
  const maxY = Math.max(r, heroBounds.height - r)
  smileyCenter.x = Math.min(Math.max(smileyCenter.x, r), maxX)
  smileyCenter.y = Math.min(Math.max(smileyCenter.y, r), maxY)
}

// Cheap broad-phase check: does the circle's own bounding box overlap the letter's bounding box?
const circleOverlapsRect = (cx: number, cy: number, r: number, rect: Rect) =>
  cx + r > rect.left && cx - r < rect.right && cy + r > rect.top && cy - r < rect.bottom

// Exact hit test against a path's actual fill, not its bounding box. Tests a Path2D copy of the
// glyph on an offscreen canvas, so it's pure geometry — no layout reads in the per-frame loop.
const isPointInLetter = (paths: Path2D[], x: number, y: number) => {
  if (!hitTestContext) return false

  const viewBoxX = (x - logoViewBox.left) * logoViewBox.scaleX + logoViewBox.originX
  const viewBoxY = (y - logoViewBox.top) * logoViewBox.scaleY + logoViewBox.originY

  return paths.some((path) => hitTestContext?.isPointInPath(path, viewBoxX, viewBoxY))
}

// Samples points around the circle's edge against the letter's actual shape (not its bounding
// box), so the smiley deflects off the visible glyph outline rather than an invisible box around
// it. Returns the outward-pointing contact normal, or null when the shape isn't actually touched.
const findLetterContactNormal = (cx: number, cy: number, r: number, paths: Path2D[]) => {
  let normalX = 0
  let normalY = 0
  let insideCount = 0

  for (let i = 0; i < SMILEY_SAMPLE_COUNT; i++) {
    const angle = (i / SMILEY_SAMPLE_COUNT) * Math.PI * 2
    const offsetX = Math.cos(angle) * r
    const offsetY = Math.sin(angle) * r

    if (!isPointInLetter(paths, cx + offsetX, cy + offsetY)) continue

    insideCount++
    normalX += offsetX
    normalY += offsetY
  }

  if (insideCount === 0) return null

  const len = Math.hypot(normalX, normalY)
  if (len > 0) return { x: -normalX / len, y: -normalY / len }

  // Sample points inside the shape cancelled out (roughly symmetric overlap) — bounce straight back.
  const velocity = smileyBody?.velocity ?? { x: 0, y: 0 }
  const speed = Math.hypot(velocity.x, velocity.y) || 1
  return { x: -velocity.x / speed, y: -velocity.y / speed }
}

const buildSmileyWalls = (w: number, h: number) => {
  const wallOptions = { isStatic: true, collisionFilter: { category: SMILEY_WALL_CATEGORY } }
  return [
    Bodies.rectangle(w / 2, h + SMILEY_WALL_PAD / 2, w + SMILEY_WALL_PAD * 2, SMILEY_WALL_PAD, wallOptions),
    Bodies.rectangle(w / 2, -SMILEY_WALL_PAD / 2, w + SMILEY_WALL_PAD * 2, SMILEY_WALL_PAD, wallOptions),
    Bodies.rectangle(-SMILEY_WALL_PAD / 2, h / 2, SMILEY_WALL_PAD, h + SMILEY_WALL_PAD * 2, wallOptions),
    Bodies.rectangle(w + SMILEY_WALL_PAD / 2, h / 2, SMILEY_WALL_PAD, h + SMILEY_WALL_PAD * 2, wallOptions),
  ]
}

// Wall bounces are resolved by matter-js itself (elastic walls, restitution 1) — this just flags
// that one happened this frame so the spin-randomisation below still fires, same as a letter bounce.
const handleSmileyWallCollision = (event: IEventCollision<Engine>) => {
  if (!smileyBody) return

  const hitWall = event.pairs.some(
    (pair) =>
      (pair.bodyA === smileyBody && smileyWalls.includes(pair.bodyB)) ||
      (pair.bodyB === smileyBody && smileyWalls.includes(pair.bodyA)),
  )

  if (hitWall) wallBounceThisFrame = true
}

const handleSmileyDragStart = () => {
  isDraggingSmiley.value = true
  smileyDecayElapsed = null

  // AppTagline and AppDock are siblings of the page in app.vue, not descendants of the hero, and
  // both overlap it (Tagline absolutely, Dock as a fixed full-viewport layer). Without this, dragging
  // over them selects their text and starves the mouse constraint of mousemove (since those elements
  // aren't inside wrapperEl, events never bubble to it), leaving the smiley stuck mid-drag.
  appStore.setIsSmileyDragging(true)

  // Unlike letters (blocked but not bounced while dragging — see tickSmiley), the walls are a real
  // matter-js body with restitution, so without this a fast drag toward the edge has the mouse
  // constraint pulling one way and the wall's restitution pushing back the other, fighting for a
  // frame and reading as a wrong-direction bounce. Let a drag go anywhere; walls re-engage on release.
  if (smileyBody) smileyBody.collisionFilter.mask = ~SMILEY_WALL_CATEGORY
}

const handleSmileyDragEnd = () => {
  isDraggingSmiley.value = false
  appStore.setIsSmileyDragging(false)

  if (!smileyBody) return

  const speed = Math.hypot(smileyBody.velocity.x, smileyBody.velocity.y)
  const speedPxPerSecond = speed * SMILEY_VELOCITY_UNIT
  const maxFlingSpeed = SMILEY_SPEED * SMILEY_FLING_SPEED_MULTIPLIER_MAX

  if (speedPxPerSecond > maxFlingSpeed) {
    const capScale = maxFlingSpeed / speedPxPerSecond
    Body.setVelocity(smileyBody, { x: smileyBody.velocity.x * capScale, y: smileyBody.velocity.y * capScale })
  }

  // Belt-and-braces: the circle's visible spin is driven entirely by smileyRotation, never by
  // smileyBody.angle, but zeroing this out too means no stray torque can linger into the next drag.
  Body.setAngularVelocity(smileyBody, 0)

  // Re-engage wall collision now that the drag (which disabled it) is over.
  smileyBody.collisionFilter.mask = 0xffffffff

  smileyDecayElapsed = 0
}

// matter-js's Mouse only listens for mouseup on the element it was created with — if the button is
// released after the cursor has left that element (e.g. dragged out past the viewport edge), that
// mouseup is never seen, so the constraint never releases and the smiley stays glued to the cursor.
// Feeding the same event into the mouse's own handler from a window-level listener closes that gap.
let releaseSmileyMouseUp: ((event: MouseEvent) => void) | null = null

// Only rebuilds the mouse/constraint pair — the underlying Engine/body/walls stay alive for the
// component's whole lifetime, gated only by canDragSmiley so touch devices attach nothing at all.
const attachSmileyDrag = () => {
  if (!engine || !wrapperEl.value || mouseConstraint) return

  const mouse = Mouse.create(wrapperEl.value)
  // matter-js registers 'wheel' with passive: false and calls preventDefault — remove it so page scroll works
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mouse.element.removeEventListener('wheel', (mouse as any).mousewheel as EventListener)

  mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, damping: 0.1 },
  })
  Composite.add(engine.world, mouseConstraint)

  Events.on(mouseConstraint, 'startdrag', handleSmileyDragStart)
  Events.on(mouseConstraint, 'enddrag', handleSmileyDragEnd)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  releaseSmileyMouseUp = (event) => (mouse as any).mouseup(event)
  window.addEventListener('mouseup', releaseSmileyMouseUp)
}

const detachSmileyDrag = () => {
  if (!engine || !mouseConstraint) return

  Events.off(mouseConstraint, 'startdrag', handleSmileyDragStart)
  Events.off(mouseConstraint, 'enddrag', handleSmileyDragEnd)
  Composite.remove(engine.world, mouseConstraint)
  mouseConstraint = null

  if (releaseSmileyMouseUp) window.removeEventListener('mouseup', releaseSmileyMouseUp)
  releaseSmileyMouseUp = null
}

const forceEndSmileyDrag = () => {
  if (!isDraggingSmiley.value) return
  handleSmileyDragEnd()
}

const setupSmileyEngine = () => {
  engine = Engine.create({ gravity: { x: 0, y: 0 } })

  smileyWalls = buildSmileyWalls(heroBounds.width, heroBounds.height)
  Composite.add(engine.world, smileyWalls)

  smileyBody = Bodies.circle(smileyCenter.x, smileyCenter.y, smileyRadius, {
    restitution: 1,
    frictionAir: 0,
  })
  Body.setVelocity(smileyBody, { x: SMILEY_SPEED / SMILEY_VELOCITY_UNIT, y: SMILEY_SPEED / SMILEY_VELOCITY_UNIT })
  Composite.add(engine.world, smileyBody)

  Events.on(engine, 'collisionStart', handleSmileyWallCollision)

  if (canDragSmiley.value) attachSmileyDrag()
}

// A resize swaps in a freshly-sized body/walls rather than resizing in place — matter-js circles
// aren't cheaply resizable, and Services.vue's chip-resize handling already establishes this
// recreate-preserving-velocity pattern in this codebase.
const rebuildSmileyPhysicsBounds = () => {
  if (!engine || !smileyBody) return

  Composite.remove(engine.world, smileyWalls)
  smileyWalls = buildSmileyWalls(heroBounds.width, heroBounds.height)
  Composite.add(engine.world, smileyWalls)

  const r = smileyRadius
  const maxX = Math.max(r, heroBounds.width - r)
  const maxY = Math.max(r, heroBounds.height - r)
  const x = Math.min(Math.max(smileyBody.position.x, r), maxX)
  const y = Math.min(Math.max(smileyBody.position.y, r), maxY)
  const velocity = smileyBody.velocity

  Composite.remove(engine.world, smileyBody)
  smileyBody = Bodies.circle(x, y, r, { restitution: 1, frictionAir: 0 })
  Body.setVelocity(smileyBody, velocity)
  Composite.add(engine.world, smileyBody)

  smileyCenter.x = x
  smileyCenter.y = y
  applySmileyTransform()
}

const tickSmiley = (time: number) => {
  if (!engine || !smileyBody) {
    smileyRafId = requestAnimationFrame(tickSmiley)
    return
  }

  if (!smileyLastTime) smileyLastTime = time
  const dt = Math.min((time - smileyLastTime) / 1000, SMILEY_MAX_DT)
  smileyLastTime = time

  if (!isDraggingSmiley.value && smileyDecayElapsed !== null) {
    smileyDecayElapsed += dt
    const speed = Math.hypot(smileyBody.velocity.x, smileyBody.velocity.y)
    const speedPxPerSecond = speed * SMILEY_VELOCITY_UNIT

    if (
      smileyDecayElapsed >= SMILEY_DECAY_DURATION ||
      Math.abs(speedPxPerSecond - SMILEY_SPEED) <= SMILEY_DECAY_SNAP_THRESHOLD
    ) {
      smileyDecayElapsed = null
    }

    if (speed > 0) {
      const decayRate = 3 / SMILEY_DECAY_DURATION // ~95% of the gap closes within SMILEY_DECAY_DURATION
      const lerpFactor = 1 - Math.exp(-decayRate * dt)
      const targetSpeed = SMILEY_SPEED / SMILEY_VELOCITY_UNIT
      const newSpeed = speed + (targetSpeed - speed) * lerpFactor
      const decayScale = newSpeed / speed
      Body.setVelocity(smileyBody, {
        x: smileyBody.velocity.x * decayScale,
        y: smileyBody.velocity.y * decayScale,
      })
    }
  }

  wallBounceThisFrame = false
  // Equal sub-steps (not a fixed-step accumulator) keep the delta near-constant frame to frame,
  // so matter-js's delta-change velocity correction doesn't spike.
  const frameMs = dt * 1000
  const steps = Math.max(1, Math.ceil(frameMs / SMILEY_PHYSICS_STEP))
  const stepMs = frameMs / steps
  for (let i = 0; i < steps; i++) Engine.update(engine, stepMs)

  let bounced = wallBounceThisFrame

  // Runs while dragging too — a dragged smiley should be blocked by the letters, not pass through
  // them. Dragging only skips the velocity-reflect/spin branch below (there's no free velocity to
  // bounce mid-drag, the mouse constraint owns position); the push-out step still runs every frame
  // it's overlapping, so the letter acts as a solid stop the mouse constraint can't pull it past —
  // it settles right at the boundary rather than jittering, same as it already does for a graze.
  {
    const r = smileyRadius
    const { x, y } = smileyBody.position

    let touchingLetterIndex: number | null = null

    for (let i = 0; i < logoLetters.length; i++) {
      const letter = logoLetters[i]
      if (!circleOverlapsRect(x, y, r, letter.rect)) continue

      const normal = findLetterContactNormal(x, y, r, letter.paths)
      if (!normal) continue

      // Only reflect once per contact — while still overlapping on later frames, just keep pushing
      // out so a shallow graze doesn't get reflected over and over into a jitter.
      if (!isDraggingSmiley.value && activeLetterIndex !== i) {
        const velocity = smileyBody.velocity
        const dot = velocity.x * normal.x + velocity.y * normal.y
        Body.setVelocity(smileyBody, {
          x: velocity.x - 2 * dot * normal.x,
          y: velocity.y - 2 * dot * normal.y,
        })
        bounced = true
      }

      Body.translate(smileyBody, { x: normal.x * SMILEY_PUSH_STEP, y: normal.y * SMILEY_PUSH_STEP })
      touchingLetterIndex = i

      break
    }

    activeLetterIndex = touchingLetterIndex
  }

  if (bounced) {
    smileySpinDirection *= -1
    smileySpinSpeed = SMILEY_SPIN_SPEED_MIN + Math.random() * (SMILEY_SPIN_SPEED_MAX - SMILEY_SPIN_SPEED_MIN)
  }

  smileyRotation += smileySpinDirection * smileySpinSpeed * dt

  smileyCenter.x = smileyBody.position.x
  smileyCenter.y = smileyBody.position.y
  applySmileyTransform()

  smileyRafId = requestAnimationFrame(tickSmiley)
}

const startSmileyLoop = () => {
  if (smileyRafId !== null) return

  smileyLastTime = 0 // reset so dt doesn't spike after being paused
  smileyRafId = requestAnimationFrame(tickSmiley)
}

const stopSmileyLoop = () => {
  if (smileyRafId === null) return

  cancelAnimationFrame(smileyRafId)
  smileyRafId = null
}

onMounted(() => {
  hitTestContext = document.createElement('canvas').getContext('2d')

  measureSmileyBounds()
  smileyCenter.x = Math.max(heroBounds.width - smileyRadius - 24, smileyRadius)
  smileyCenter.y = smileyRadius + 24
  clampSmileyPosition()
  applySmileyTransform()

  setupSmileyEngine()
  startSmileyLoop()

  // Wait a frame so the initial position is painted before fading in, avoiding a top-left flash.
  requestAnimationFrame(() => {
    smileyReady.value = true
  })

  useResizeObserver(wrapperEl, () => {
    // A resize swaps in a fresh body/walls sized from stale mid-drag geometry would be wrong — end
    // any active drag first so there's a single code path for how a drag ends.
    forceEndSmileyDrag()
    measureSmileyBounds()
    rebuildSmileyPhysicsBounds()
  })

  // Pause the rAF loop while the hero is scrolled out of view — the collision/hit-test math and
  // physics stepping are pure waste when nothing is visible.
  useIntersectionObserver(wrapperEl, ([entry]) => {
    if (entry?.isIntersecting) {
      startSmileyLoop()
    } else {
      stopSmileyLoop()
    }
  })

  // Drag capability can change at runtime (e.g. a mouse plugged into a touch device) — keep the
  // MouseConstraint in sync with it rather than only checking once at mount.
  watch(canDragSmiley, (canDrag) => {
    if (canDrag) attachSmileyDrag()
    else detachSmileyDrag()
  })
})

onUnmounted(() => {
  stopSmileyLoop()
  detachSmileyDrag()

  if (engine) {
    Events.off(engine, 'collisionStart', handleSmileyWallCollision)
    Engine.clear(engine)
  }

  engine = null
  smileyBody = null
  smileyWalls = []
})
</script>

<template>
  <div class="overflow-hidden">
    <div
      ref="wrapperEl"
      class="relative wrapper min-h-svh flex flex-col justify-end pt-40"
    >
      <svg
        ref="logoEl"
        class="w-full h-auto -mb-1.5 overflow-visible *:[pointer-events:bounding-box] select-none"
        viewBox="0 0 1802 622"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <g
          ref="iEl"
          @click="playI"
          :class="{ 'cursor-pointer': isAudioOn }"
        >
          <path
            ref="iDotEl"
            d="M722.218 65.5554C724.115 31.3 697.883 1.99247 663.628 0.0952894C629.372 -1.8019 600.065 24.4296 598.168 58.6851C596.271 92.9405 622.502 122.248 656.758 124.145C691.013 126.042 720.321 99.8108 722.218 65.5554Z"
          />

          <path
            ref="iStemEl"
            d="M722.879 180.781H540.696L521.477 281.895H582.483L540.696 513.378H473.011L454.627 614.501H714.521L732.906 513.378H663.543L722.879 180.781Z"
          />
        </g>

        <path
          ref="dEl"
          :class="['logo-d', { 'cursor-pointer': isAudioOn }]"
          d="M386.081 5.28589L347.643 223.403C324.241 193.322 274.94 174.094 225.631 174.094C86.913 174.093 0 287.748 0 423.126C0 539.285 73.538 621.189 168.808 621.189C222.291 621.189 268.252 596.952 289.141 566.027L279.949 614.501H403.631L508.927 5.28589H386.08H386.081ZM209.751 516.727C159.616 516.727 124.517 474.94 124.517 418.117C124.517 338.727 170.478 278.556 237.328 278.556C289.142 278.556 325.076 315.325 325.076 372.991C325.076 441.51 284.132 516.727 209.751 516.727Z"
          @click="playD"
        />

        <path
          ref="tEl"
          :class="['logo-t', { 'cursor-pointer': isAudioOn }]"
          d="M1230.38 281.895H1369.1L1387.49 180.781H1248.76L1270.49 54.595H1147.65L1125.92 180.781H943.741L965.465 54.595H842.618L775.768 436.501C753.2 561.852 822.564 621.188 932.035 621.188C962.96 621.188 986.362 617.005 1006.42 611.161L1024.8 505.864C1006.42 511.708 988.031 515.057 957.941 515.057C910.31 515.057 888.578 493.324 896.935 443.189L925.355 281.894H1108.37L1080.8 436.501C1058.23 561.852 1127.59 621.188 1237.06 621.188C1267.98 621.188 1291.38 617.005 1311.44 611.161L1329.82 505.864C1311.43 511.708 1293.05 515.057 1262.97 515.057C1215.34 515.057 1193.61 493.324 1201.96 443.189L1230.37 281.894L1230.38 281.895Z"
          @click="playT"
        />

        <path
          ref="aEl"
          :class="['logo-a', { 'cursor-pointer': isAudioOn }]"
          d="M1786.12 515.891C1767.73 515.891 1763.55 500.846 1766.06 485.801L1787.79 362.119C1807.84 245.96 1733.47 174.092 1608.12 174.092C1512.01 174.092 1415.91 234.263 1404.21 328.699H1522.04C1529.56 289.417 1561.31 266.858 1606.44 266.858C1648.23 266.858 1672.46 286.912 1672.46 310.314C1672.46 332.038 1658.25 345.413 1636.53 347.918L1546.28 357.11C1454.35 366.302 1377.47 409.759 1377.47 498.341C1377.47 576.897 1439.31 621.188 1527.89 621.188C1585.55 621.188 1639.03 598.621 1656.58 566.861C1659.09 596.951 1692.52 620.353 1735.97 620.353C1756.86 620.353 1771.91 617.839 1783.6 614.5L1801.16 514.221C1797.82 515.056 1792.8 515.891 1786.12 515.891ZM1654.08 438.171C1643.22 492.489 1603.94 530.927 1545.44 530.927C1514.52 530.927 1496.97 515.891 1496.97 492.488C1496.97 462.407 1522.88 441.509 1559.65 436.5L1656.59 423.125L1654.08 438.17L1654.08 438.171Z"
          @click="playA"
        />
      </svg>

      <div
        ref="smileyEl"
        :class="[
          { 'opacity-0': !smileyReady },
          canDragSmiley ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-none',
        ]"
        class="absolute top-0 left-0 w-20 md:w-40 will-change-transform transition-opacity duration-500 ease-outCubic"
      >
        <div
          ref="smileySpinEl"
          class="w-full h-auto will-change-transform"
        >
          <IconSmiley class="w-full h-auto" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes drum-hit {
  0% {
    transform: scale(1);
  }
  20% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes drum-i-dot-hit {
  0% {
    transform: translateY(0);
  }
  20% {
    transform: translateY(66%) scale(1.2, 0.9);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes drum-i-stem-hit {
  0% {
    transform: scale(1, 1);
  }
  20% {
    transform: scale(1.1, 0.95);
  }
  100% {
    transform: scale(1, 1);
  }
}

@keyframes drum-t-hit {
  0% {
    transform: skewX(0deg);
  }
  20% {
    transform: skewX(-5deg);
  }
  100% {
    transform: skewX(0deg);
  }
}

.is-d-hit {
  animation: drum-hit 0.35s var(--ease-outCubic);
  transform-box: fill-box;
  transform-origin: bottom right;
}

.is-a-hit {
  animation: drum-hit 0.35s var(--ease-outCubic);
  transform-box: fill-box;
  transform-origin: bottom left;
}

.is-i-hit {
  & path:nth-child(1) {
    animation: drum-i-dot-hit 0.35s var(--ease-outCubic);
    transform-box: fill-box;
    transform-origin: center;
  }

  & path:nth-child(2) {
    animation: drum-i-stem-hit 0.34s var(--ease-outCubic) 0.02s;
    transform-box: fill-box;
    transform-origin: bottom center;
  }
}

.is-t-hit {
  animation: drum-t-hit 0.35s var(--ease-outCubic);
  transform-box: fill-box;
  transform-origin: bottom left;
}
</style>
