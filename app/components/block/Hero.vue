<script lang="ts" setup>
import type { Block } from '#storyblok-schema'
import type { Ref } from 'vue'
import { onKeyStroke, useIntersectionObserver, useResizeObserver } from '@vueuse/core'
import { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } from 'matter-js'
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

const SMILEY_SPEED = 160 // px/s
const SMILEY_SPIN_SPEED_MIN = 10 // deg/s
const SMILEY_SPIN_SPEED_MAX = 120 // deg/s
const SMILEY_FLING_SPEED_MULTIPLIER_MAX = 5
const SMILEY_DECAY_DURATION = 5 // s
const SMILEY_DECAY_SNAP_THRESHOLD = 4 // px/s
const SMILEY_VELOCITY_UNIT = 60 // matter-js velocity is px per 1/60s
const SMILEY_MAX_DT = 0.1 // s; clamp tab-switch gaps
const SMILEY_PHYSICS_STEP = 1000 / 60 // max ms per Engine.update
// Walls/logo collisions are handled manually
const SMILEY_BODY_OPTIONS = { restitution: 1, frictionAir: 0, friction: 0, frictionStatic: 0, inertia: Infinity }

// Non-reactive: transforms are written straight to the DOM
const smileyCenter = { x: 0, y: 0 }
let smileyRadius = 0
let smileyRotation = 0
const heroBounds = { width: 0, height: 0 }

const logoViewBox = { left: 0, top: 0, scaleX: 1, scaleY: 1, originY: 0 }

// Logo collides as a solid skyline (topmost filled y per column, viewBox units)
const LOGO_SKYLINE_UNIT = 2
const LOGO_PUSH_MAX_ITERATIONS = 3
const LOGO_PUSH_EPSILON = 0.5 // px
const LOGO_TOUCH_MARGIN = 2 // px
const LOGO_HIT_MIN_SPEED = 60 // px/s
const LOGO_BUMPER_BOOST = 3.5
const LOGO_BUMPER_DECAY_DURATION = 8 // s
let logoSkyline = new Float32Array(0)
let logoSkylineLetter = new Int8Array(0)
let logoSkylineTop = Infinity

const SMILEY_DRAG_MAX_STEP_RATIO = 0.5

const smileyReady = ref(false)
const isDraggingSmiley = ref(false)
const canDragSmiley = useAtMedia('(pointer: fine)')

let isTouchingLogo = false
let smileyRafId: number | null = null
let smileyLastTime = 0
let smileySpinDirection = 1
let smileySpinSpeed = SMILEY_SPIN_SPEED_MIN
let smileyDecayElapsed: number | null = null
let smileyDecayDuration = SMILEY_DECAY_DURATION

let engine: Engine | null = null
let smileyBody: Body | null = null
let mouseConstraint: MouseConstraint | null = null

const applySmileyTransform = () => {
  if (smileyEl.value) {
    smileyEl.value.style.transform = `translate3d(${smileyCenter.x - smileyRadius}px, ${smileyCenter.y - smileyRadius}px, 0)`
  }

  if (smileySpinEl.value) smileySpinEl.value.style.transform = `rotate(${smileyRotation}deg)`
}

const hit = (el: Ref<SVGElement | null>, cls = 'is-hit') => {
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

// Order matches letterGroups in buildLogoSkyline
const LOGO_LETTER_HITS = [
  { el: dEl, cls: 'is-d-hit', sound: kickSound },
  { el: iEl, cls: 'is-i-hit', sound: snareSound },
  { el: tEl, cls: 'is-t-hit', sound: hatSound },
  { el: aEl, cls: 'is-a-hit', sound: tomSound },
]

const hitLogoLetter = (index: number) => {
  const letter = LOGO_LETTER_HITS[index]
  if (!letter) return

  hit(letter.el, letter.cls)
  if (isAudioOn.value) play(letter.sound)
}

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
    logoViewBox.originY = viewBox.y
  }
}

const buildLogoSkyline = () => {
  if (!logoEl.value) return

  const viewBox = logoEl.value.viewBox.baseVal
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewBox.width / LOGO_SKYLINE_UNIT)
  canvas.height = Math.ceil(viewBox.height / LOGO_SKYLINE_UNIT)

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  ctx.scale(1 / LOGO_SKYLINE_UNIT, 1 / LOGO_SKYLINE_UNIT)
  ctx.translate(-viewBox.x, -viewBox.y)
  for (const path of logoEl.value.querySelectorAll('path')) ctx.fill(new Path2D(path.getAttribute('d') ?? ''))

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  logoSkyline = new Float32Array(width).fill(Infinity)

  for (let column = 0; column < width; column++) {
    for (let row = 0; row < height; row++) {
      if ((data[(row * width + column) * 4 + 3] ?? 0) <= 127) continue

      logoSkyline[column] = viewBox.y + row * LOGO_SKYLINE_UNIT
      break
    }
  }

  logoSkylineTop = Math.min(...logoSkyline)

  // Tag each column with its letter (reset: isPointInPath applies the current transform)
  const letterGroups = [[dEl.value], [iDotEl.value, iStemEl.value], [tEl.value], [aEl.value]].map((group) =>
    group.flatMap((path) => (path ? [new Path2D(path.getAttribute('d') ?? '')] : [])),
  )
  ctx.resetTransform()
  logoSkylineLetter = new Int8Array(width).fill(-1)

  for (let column = 0; column < width; column++) {
    const skylineY = logoSkyline[column]
    if (skylineY === undefined || skylineY === Infinity) continue

    const x = viewBox.x + (column + 0.5) * LOGO_SKYLINE_UNIT
    const y = skylineY + LOGO_SKYLINE_UNIT
    logoSkylineLetter[column] = letterGroups.findIndex((paths) => paths.some((path) => ctx.isPointInPath(path, x, y)))
  }

  // Anti-aliased edges miss every path; borrow the neighbour's letter
  for (let column = 1; column < width; column++) {
    if (logoSkylineLetter[column] === -1 && logoSkyline[column] !== Infinity) {
      logoSkylineLetter[column] = logoSkylineLetter[column - 1] ?? -1
    }
  }
}

const clampSmileyPosition = () => {
  const r = smileyRadius
  const maxX = Math.max(r, heroBounds.width - r)
  const maxY = Math.max(r, heroBounds.height - r)
  smileyCenter.x = Math.min(Math.max(smileyCenter.x, r), maxX)
  smileyCenter.y = Math.min(Math.max(smileyCenter.y, r), maxY)
}

// Circle vs skyline: outward normal, depth and letter, or null
const findLogoContact = (cx: number, cy: number, r: number) => {
  const { left, top, scaleX, scaleY, originY } = logoViewBox
  const toPxY = (viewBoxY: number) => top + (viewBoxY - originY) / scaleY

  if (cy + r <= toPxY(logoSkylineTop)) return null

  const columnWidth = LOGO_SKYLINE_UNIT / scaleX
  const first = Math.max(0, Math.floor((cx - r - left) / columnWidth))
  const last = Math.min(logoSkyline.length - 1, Math.ceil((cx + r - left) / columnWidth))

  let nearest = Infinity
  let nearestX = 0
  let nearestY = 0
  let nearestColumn = -1
  let centreColumn = -1
  let centreColumnSkylineY = Infinity

  for (let column = first; column <= last; column++) {
    const skylineViewBoxY = logoSkyline[column]
    if (skylineViewBoxY === undefined || skylineViewBoxY === Infinity) continue

    const x = left + (column + 0.5) * columnWidth
    const skylineY = toPxY(skylineViewBoxY)
    if (Math.abs(x - cx) <= columnWidth / 2) {
      centreColumn = column
      centreColumnSkylineY = skylineY
    }

    const y = Math.max(skylineY, cy)
    const distance = Math.hypot(x - cx, y - cy)
    if (distance >= nearest) continue

    nearest = distance
    nearestX = x
    nearestY = y
    nearestColumn = column
  }

  // Centre inside the logo: lift straight out
  if (centreColumnSkylineY <= cy) {
    return {
      normal: { x: 0, y: -1 },
      depth: r + cy - centreColumnSkylineY,
      letter: logoSkylineLetter[centreColumn] ?? -1,
    }
  }

  if (nearest >= r + LOGO_TOUCH_MARGIN) return null

  return {
    normal: { x: (cx - nearestX) / nearest, y: (cy - nearestY) / nearest },
    depth: r - nearest,
    letter: logoSkylineLetter[nearestColumn] ?? -1,
  }
}

const handleSmileyDragStart = () => {
  isDraggingSmiley.value = true
  smileyDecayElapsed = null

  // Tagline/Dock overlap the hero and would swallow mousemove mid-drag
  appStore.setIsSmileyDragging(true)
}

const capSmileySpeedAndEaseBack = (duration = SMILEY_DECAY_DURATION) => {
  if (!smileyBody) return

  const speed = Math.hypot(smileyBody.velocity.x, smileyBody.velocity.y)
  const speedPxPerSecond = speed * SMILEY_VELOCITY_UNIT
  const maxFlingSpeed = SMILEY_SPEED * SMILEY_FLING_SPEED_MULTIPLIER_MAX

  if (speedPxPerSecond > maxFlingSpeed) {
    const capScale = maxFlingSpeed / speedPxPerSecond
    Body.setVelocity(smileyBody, { x: smileyBody.velocity.x * capScale, y: smileyBody.velocity.y * capScale })
  }

  smileyDecayElapsed = 0
  smileyDecayDuration = duration
}

const handleSmileyDragEnd = () => {
  isDraggingSmiley.value = false
  appStore.setIsSmileyDragging(false)

  if (!smileyBody) return

  capSmileySpeedAndEaseBack()
}

// matter-js misses mouseup outside its element
let releaseSmileyMouseUp: ((event: MouseEvent) => void) | null = null

const attachSmileyDrag = () => {
  if (!engine || !wrapperEl.value || mouseConstraint) return

  const mouse = Mouse.create(wrapperEl.value)
  // Let the page scroll
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

  smileyBody = Bodies.circle(smileyCenter.x, smileyCenter.y, smileyRadius, SMILEY_BODY_OPTIONS)
  Body.setVelocity(smileyBody, { x: SMILEY_SPEED / SMILEY_VELOCITY_UNIT, y: SMILEY_SPEED / SMILEY_VELOCITY_UNIT })
  Composite.add(engine.world, smileyBody)

  if (canDragSmiley.value) attachSmileyDrag()
}

const rebuildSmileyPhysicsBounds = () => {
  if (!engine || !smileyBody) return

  const r = smileyRadius
  const maxX = Math.max(r, heroBounds.width - r)
  const maxY = Math.max(r, heroBounds.height - r)
  const x = Math.min(Math.max(smileyBody.position.x, r), maxX)
  const y = Math.min(Math.max(smileyBody.position.y, r), maxY)
  const velocity = smileyBody.velocity

  Composite.remove(engine.world, smileyBody)
  smileyBody = Bodies.circle(x, y, r, SMILEY_BODY_OPTIONS)
  Body.setVelocity(smileyBody, velocity)
  Composite.add(engine.world, smileyBody)

  smileyCenter.x = x
  smileyCenter.y = y
  applySmileyTransform()
}

// Stop fast drags tunnelling into the logo
const limitSmileyDragStep = (before: { x: number; y: number }) => {
  if (!smileyBody) return

  const dx = smileyBody.position.x - before.x
  const dy = smileyBody.position.y - before.y
  const distance = Math.hypot(dx, dy)
  const maxDistance = smileyRadius * SMILEY_DRAG_MAX_STEP_RATIO
  if (distance <= maxDistance) return

  const scale = maxDistance / distance
  Body.setPosition(smileyBody, { x: before.x + dx * scale, y: before.y + dy * scale })
}

// Bounces off the logo, or slides along it while dragging. Returns whether it bounced.
const collideSmileyWithLogo = () => {
  if (!smileyBody) return false

  let contact = findLogoContact(smileyBody.position.x, smileyBody.position.y, smileyRadius)
  if (!contact) {
    isTouchingLogo = false
    return false
  }

  const { normal } = contact
  const velocity = smileyBody.velocity
  const dot = velocity.x * normal.x + velocity.y * normal.y
  let bounced = false

  const isNewContact = !isTouchingLogo
  isTouchingLogo = true

  const isLetterHit = isNewContact && -dot * SMILEY_VELOCITY_UNIT >= LOGO_HIT_MIN_SPEED
  if (isLetterHit) hitLogoLetter(contact.letter)

  if (isDraggingSmiley.value) {
    if (dot < 0) Body.setVelocity(smileyBody, { x: velocity.x - dot * normal.x, y: velocity.y - dot * normal.y })
  } else if (isNewContact && dot < 0) {
    // Reflect once per contact; letter hits raise speed to bumper speed
    const reflected = { x: velocity.x - 2 * dot * normal.x, y: velocity.y - 2 * dot * normal.y }
    const reflectedSpeed = Math.hypot(reflected.x, reflected.y) * SMILEY_VELOCITY_UNIT
    const bumperSpeed = SMILEY_SPEED * LOGO_BUMPER_BOOST
    const boost = isLetterHit && reflectedSpeed > 0 ? Math.max(1, bumperSpeed / reflectedSpeed) : 1
    Body.setVelocity(smileyBody, { x: reflected.x * boost, y: reflected.y * boost })
    bounced = true

    if (boost > 1) capSmileySpeedAndEaseBack(LOGO_BUMPER_DECAY_DURATION)
  }

  for (let i = 0; contact && contact.depth > 0 && i < LOGO_PUSH_MAX_ITERATIONS; i++) {
    const push = contact.depth + LOGO_PUSH_EPSILON
    Body.translate(smileyBody, { x: contact.normal.x * push, y: contact.normal.y * push })
    contact = findLogoContact(smileyBody.position.x, smileyBody.position.y, smileyRadius)
  }

  return bounced
}

// Manual walls: matter-js treats slow hits as resting contact
const collideSmileyWithWalls = () => {
  if (!smileyBody || isDraggingSmiley.value) return false

  const r = smileyRadius
  const { x, y } = smileyBody.position
  const insideX = Math.min(Math.max(x, r), Math.max(r, heroBounds.width - r))
  const insideY = Math.min(Math.max(y, r), Math.max(r, heroBounds.height - r))
  if (insideX === x && insideY === y) return false

  let { x: vx, y: vy } = smileyBody.velocity
  let bounced = false

  if (insideX !== x && Math.sign(x - insideX) === Math.sign(vx)) {
    vx = -vx
    bounced = true
  }

  if (insideY !== y && Math.sign(y - insideY) === Math.sign(vy)) {
    vy = -vy
    bounced = true
  }

  Body.setPosition(smileyBody, { x: insideX, y: insideY })
  if (bounced) Body.setVelocity(smileyBody, { x: vx, y: vy })

  return bounced
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

    const isDecayDone =
      smileyDecayElapsed >= smileyDecayDuration ||
      Math.abs(speedPxPerSecond - SMILEY_SPEED) <= SMILEY_DECAY_SNAP_THRESHOLD
    if (isDecayDone) smileyDecayElapsed = null

    if (speed > 0) {
      const decayRate = 3 / smileyDecayDuration // ~95% closed by duration
      const lerpFactor = isDecayDone ? 1 : 1 - Math.exp(-decayRate * dt)
      const targetSpeed = SMILEY_SPEED / SMILEY_VELOCITY_UNIT
      const newSpeed = speed + (targetSpeed - speed) * lerpFactor
      const decayScale = newSpeed / speed
      Body.setVelocity(smileyBody, {
        x: smileyBody.velocity.x * decayScale,
        y: smileyBody.velocity.y * decayScale,
      })
    }
  }

  // Equal sub-steps keep matter-js's delta correction stable
  const frameMs = dt * 1000
  const steps = Math.max(1, Math.ceil(frameMs / SMILEY_PHYSICS_STEP))
  const stepMs = frameMs / steps
  let bounced = false

  for (let i = 0; i < steps; i++) {
    const before = { x: smileyBody.position.x, y: smileyBody.position.y }
    Engine.update(engine, stepMs)
    if (isDraggingSmiley.value) limitSmileyDragStep(before)
    if (collideSmileyWithLogo()) bounced = true
    if (collideSmileyWithWalls()) bounced = true
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

  smileyLastTime = 0
  smileyRafId = requestAnimationFrame(tickSmiley)
}

const stopSmileyLoop = () => {
  if (smileyRafId === null) return

  cancelAnimationFrame(smileyRafId)
  smileyRafId = null
}

onMounted(() => {
  buildLogoSkyline()

  measureSmileyBounds()
  smileyCenter.x = Math.max(heroBounds.width - smileyRadius - 24, smileyRadius)
  smileyCenter.y = smileyRadius + 24
  clampSmileyPosition()
  applySmileyTransform()

  setupSmileyEngine()
  startSmileyLoop()

  // Paint position before fading in
  requestAnimationFrame(() => {
    smileyReady.value = true
  })

  useResizeObserver(wrapperEl, () => {
    forceEndSmileyDrag()
    measureSmileyBounds()
    rebuildSmileyPhysicsBounds()
  })

  useIntersectionObserver(wrapperEl, ([entry]) => {
    if (entry?.isIntersecting) {
      startSmileyLoop()
    } else {
      stopSmileyLoop()
    }
  })

  watch(canDragSmiley, (canDrag) => {
    if (canDrag) attachSmileyDrag()
    else detachSmileyDrag()
  })
})

onUnmounted(() => {
  stopSmileyLoop()
  detachSmileyDrag()

  if (engine) Engine.clear(engine)

  engine = null
  smileyBody = null
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
