<script lang="ts" setup>
import type { Block } from '#storyblok-schema'
import { onKeyStroke, useResizeObserver } from '@vueuse/core'
import { defineSound } from '@web-kits/audio'
import { kick, snare, hatClosed, tom } from '@@/.web-kits/drums'
import IconSmiley from '@/assets/icons/pixel-smiley.svg'

interface Props {
  block: Block<'block_hero'>
}

defineProps<Props>()

const { play, isAudioOn } = useAudio()

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

const SMILEY_SPEED = 160 // px/second
const SMILEY_SPIN_SPEED_MIN = 10 // deg/second
const SMILEY_SPIN_SPEED_MAX = 120 // deg/second

const smileyCenter = reactive({ x: 0, y: 0 }) // px, relative to wrapperEl
const smileyVelocity = reactive({ x: SMILEY_SPEED, y: SMILEY_SPEED })
const smileyRadius = ref(0)
const smileyRotation = ref(0)
const heroBounds = reactive({ width: 0, height: 0 })

interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

interface LogoLetter {
  rect: Rect // combined bounding box, used as a cheap broad-phase check before the exact shape test
  paths: SVGPathElement[]
}

const SMILEY_SAMPLE_COUNT = 20 // points sampled around the circle's edge for shape hit-testing
const SMILEY_PUSH_STEP = 3 // px/frame nudge to push the circle back out of a letter it's touching

const smileyReady = ref(false)

let logoLetters: LogoLetter[] = []
let wrapperOrigin = { left: 0, top: 0 }
let activeLetterIndex: number | null = null
let smileyRafId: number | null = null
let smileyLastTime = 0
let smileySpinDirection = 1 // 1 = clockwise, -1 = counter-clockwise
let smileySpinSpeed = SMILEY_SPIN_SPEED_MIN // deg/second, randomised on each bounce

const smileyStyle = computed(() => ({
  transform: `translate3d(${smileyCenter.x - smileyRadius.value}px, ${smileyCenter.y - smileyRadius.value}px, 0)`,
}))

const smileySpinStyle = computed(() => ({
  transform: `rotate(${smileyRotation.value}deg)`,
}))

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
  wrapperOrigin = { left: wrapperRect.left, top: wrapperRect.top }

  const smileyRect = smileyEl.value.getBoundingClientRect()
  smileyRadius.value = smileyRect.width / 2

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
        paths,
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
  const r = smileyRadius.value
  const maxX = Math.max(r, heroBounds.width - r)
  const maxY = Math.max(r, heroBounds.height - r)
  smileyCenter.x = Math.min(Math.max(smileyCenter.x, r), maxX)
  smileyCenter.y = Math.min(Math.max(smileyCenter.y, r), maxY)
}

// Cheap broad-phase check: does the circle's own bounding box overlap the letter's bounding box?
const circleOverlapsRect = (cx: number, cy: number, r: number, rect: Rect) =>
  cx + r > rect.left && cx - r < rect.right && cy + r > rect.top && cy - r < rect.bottom

// Exact hit test against a path's actual fill, not its bounding box — converts a client-space
// point into the path's local coordinate system via its screen CTM.
const isPointInLetter = (paths: SVGPathElement[], clientX: number, clientY: number) => {
  for (const path of paths) {
    const ctm = path.getScreenCTM()
    if (!ctm) continue

    const localPoint = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    if (path.isPointInFill(localPoint)) return true
  }

  return false
}

// Samples points around the circle's edge against the letter's actual shape (not its bounding
// box), so the smiley deflects off the visible glyph outline rather than an invisible box around
// it. Returns the outward-pointing contact normal, or null when the shape isn't actually touched.
const findLetterContactNormal = (cx: number, cy: number, r: number, paths: SVGPathElement[]) => {
  const clientCx = wrapperOrigin.left + cx
  const clientCy = wrapperOrigin.top + cy

  let normalX = 0
  let normalY = 0
  let insideCount = 0

  for (let i = 0; i < SMILEY_SAMPLE_COUNT; i++) {
    const angle = (i / SMILEY_SAMPLE_COUNT) * Math.PI * 2
    const offsetX = Math.cos(angle) * r
    const offsetY = Math.sin(angle) * r

    if (!isPointInLetter(paths, clientCx + offsetX, clientCy + offsetY)) continue

    insideCount++
    normalX += offsetX
    normalY += offsetY
  }

  if (insideCount === 0) return null

  const len = Math.hypot(normalX, normalY)
  if (len > 0) return { x: -normalX / len, y: -normalY / len }

  // Sample points inside the shape cancelled out (roughly symmetric overlap) — bounce straight back.
  const speed = Math.hypot(smileyVelocity.x, smileyVelocity.y) || 1
  return { x: -smileyVelocity.x / speed, y: -smileyVelocity.y / speed }
}

const tickSmiley = (time: number) => {
  if (!smileyLastTime) smileyLastTime = time
  const dt = (time - smileyLastTime) / 1000
  smileyLastTime = time

  let { x, y } = smileyCenter
  x += smileyVelocity.x * dt
  y += smileyVelocity.y * dt

  const r = smileyRadius.value
  const maxX = heroBounds.width - r
  const maxY = heroBounds.height - r

  let bounced = false

  if (x <= r) {
    x = r
    smileyVelocity.x = Math.abs(smileyVelocity.x)
    bounced = true
  } else if (x >= maxX) {
    x = maxX
    smileyVelocity.x = -Math.abs(smileyVelocity.x)
    bounced = true
  }

  if (y <= r) {
    y = r
    smileyVelocity.y = Math.abs(smileyVelocity.y)
    bounced = true
  } else if (y >= maxY) {
    y = maxY
    smileyVelocity.y = -Math.abs(smileyVelocity.y)
    bounced = true
  }

  let touchingLetterIndex: number | null = null

  for (let i = 0; i < logoLetters.length; i++) {
    const letter = logoLetters[i]
    if (!circleOverlapsRect(x, y, r, letter.rect)) continue

    const normal = findLetterContactNormal(x, y, r, letter.paths)
    if (!normal) continue

    // Only reflect once per contact — while still overlapping on later frames, just keep pushing
    // out so a shallow graze doesn't get reflected over and over into a jitter.
    if (activeLetterIndex !== i) {
      const dot = smileyVelocity.x * normal.x + smileyVelocity.y * normal.y
      smileyVelocity.x -= 2 * dot * normal.x
      smileyVelocity.y -= 2 * dot * normal.y
      bounced = true
    }

    x += normal.x * SMILEY_PUSH_STEP
    y += normal.y * SMILEY_PUSH_STEP
    touchingLetterIndex = i

    break
  }

  activeLetterIndex = touchingLetterIndex

  if (bounced) {
    smileySpinDirection *= -1
    smileySpinSpeed = SMILEY_SPIN_SPEED_MIN + Math.random() * (SMILEY_SPIN_SPEED_MAX - SMILEY_SPIN_SPEED_MIN)
  }

  smileyRotation.value += smileySpinDirection * smileySpinSpeed * dt

  smileyCenter.x = x
  smileyCenter.y = y

  smileyRafId = requestAnimationFrame(tickSmiley)
}

onMounted(() => {
  measureSmileyBounds()
  smileyCenter.x = Math.max(heroBounds.width - smileyRadius.value - 24, smileyRadius.value)
  smileyCenter.y = smileyRadius.value + 24
  clampSmileyPosition()
  smileyRafId = requestAnimationFrame(tickSmiley)

  // Wait a frame so the initial position is painted before fading in, avoiding a top-left flash.
  requestAnimationFrame(() => {
    smileyReady.value = true
  })

  useResizeObserver(wrapperEl, () => {
    measureSmileyBounds()
    clampSmileyPosition()
  })
})

onUnmounted(() => {
  if (smileyRafId !== null) cancelAnimationFrame(smileyRafId)
})
</script>

<template>
  <div class="overflow-hidden">
    <div
      ref="wrapperEl"
      class="relative wrapper min-h-svh flex flex-col justify-end pt-40"
    >
      <svg
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
        :style="smileyStyle"
        :class="{ 'opacity-0': !smileyReady }"
        class="absolute top-0 left-0 w-20 md:w-30 pointer-events-none will-change-transform transition-opacity duration-500 ease-outCubic"
      >
        <div
          :style="smileySpinStyle"
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
