<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { ComponentPublicInstance } from 'vue'
import type { Block } from '#storyblok-schema'
import { useEventListener, useIntersectionObserver, useResizeObserver } from '@vueuse/core'
import { defineSound } from '@web-kits/audio'
import { boop, levelUp } from '@@/.web-kits/core'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import IconMarioBrick from '@/assets/icons/mario-brick.svg'
import IconMarioSequence from '@/assets/icons/mario-sequence.svg'
import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  block: Block<'block_steps'>
}

const { block } = defineProps<Props>()
const cardsRefs = useTemplateRef('card')

const rotation = ref(0)

const onMouseMove = (event: MouseEvent) => {
  rotation.value = (event.clientX / window.innerWidth) * 80 - 40
}

onMounted(async () => {
  await nextTick()

  window.addEventListener('mousemove', onMouseMove, { passive: true })

  cardsRefs.value?.forEach((el, index) => {
    const sign = index % 2 === 0 ? 1 : -1
    const rotateFrom = sign * gsap.utils.random(3, 9)
    const rotateTo = -rotateFrom

    gsap.fromTo(
      el,
      {
        scale: 1.2,
        rotate: rotateFrom,
      },
      {
        scrollTrigger: {
          trigger: el.parentElement?.parentElement,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
          markers: false,
        },
        ease: 'power1.in',
        scale: 1,
        rotate: rotateTo,
      },
    )
  })
})

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
})

// Mario: platformer on the brick row, with Super Mario Bros. (NES) physics.
// Physics runs in sprite pixels per 1/60s frame; one sprite pixel = brick size / 16.
const MARIO_SIZE = 16 // sprite px
const MARIO_HITBOX_INSET = 2 // sprite px off each side: a 12px-wide body, like SMB's small Mario
const MARIO_STEP = 1000 / 60 // ms per physics frame
const MARIO_MAX_DT = 100 // ms; clamp tab-switch gaps
const MARIO_RENDER_EVERY = 2 // physics frames per redraw, for ~30fps choppiness

// SMB's fixed-point values, kept in its hex so they can be checked against the original: 0x01000 = 1 px/frame
const nes = (value: number) => value / 0x1000
// Horizontal values only, so running faster than the NES leaves jump height alone
const MARIO_SPEED_BOOST = 1.5
const nesX = (value: number) => nes(value) * MARIO_SPEED_BOOST
// Takeoff velocity only; height grows with its square, so 1.1 is about 20% higher
const MARIO_JUMP_BOOST = 1.1
const nesY = (value: number) => nes(value) * MARIO_JUMP_BOOST

const MARIO_MIN_WALK = nesX(0x00130) // starting from a standstill snaps straight to this
const MARIO_WALK_ACCEL = nesX(0x00098)
const MARIO_RUN_ACCEL = nesX(0x000e4) // B held
const MARIO_RELEASE_DECEL = nesX(0x000d0) // no input, or over the speed cap
const MARIO_SKID_DECEL = nesX(0x001a0) // input against current direction
const MARIO_SKID_TURN = nesX(0x00900) // a skid below this stops dead and turns round
const MARIO_WALK_SPEED = nesX(0x01900)
const MARIO_RUN_SPEED = nesX(0x02900)
const MARIO_RUN_HOLD = 10 // frames run speed lingers after B is released
const MARIO_AIR_FAST = nesX(0x01d00) // takeoff speed that keeps run speed in the air and softens backward braking
const MARIO_FALL_SPEED = nes(0x04800) // reaching this knocks him back to MARIO_FALL_RESET
const MARIO_FALL_RESET = nes(0x04000)
const MARIO_ANIM_RUN = nesX(0x01c00) // walk cycle: 2 frames per step above this
const MARIO_ANIM_WALK = nesX(0x00e00) // 4 above this, 7 below

// Picked by horizontal speed at takeoff and kept for the whole jump.
// Holding A while rising uses the light gravity: tap for a hop, hold for full height.
const MARIO_JUMPS = [
  { from: nesX(0x02500), velocity: nesY(0x05000), gravityHeld: nes(0x00280), gravity: nes(0x00900) },
  { from: nesX(0x01000), velocity: nesY(0x04000), gravityHeld: nes(0x001e0), gravity: nes(0x00600) },
  { from: 0, velocity: nesY(0x04000), gravityHeld: nes(0x00200), gravity: nes(0x00700) },
] as const
const MARIO_JUMP_STILL = MARIO_JUMPS[2]

const MARIO_PIPE_SPEED = 0.25 // sprite px per frame sliding out of the arrow's tail
const MARIO_RAGE_HOLD = 700 // ms the arrow rages before Mario drops out

// Arrow tail mouth as a fraction of the pixel-arrow viewBox (110 × 134)
const ARROW_TAIL_X = 55 / 110
const ARROW_TAIL_BOTTOM = 130 / 134

const MARIO_BUMP_DURATION = 150 // ms for a bonked word to pop up and back
const MARIO_BUMP_HEIGHT = 0.15 // em
const MARIO_COINS = 10 // like a multi-coin block, the copy's last word pays out this many before it's spent

const BRICK_RIPPLE_DELAY = 25 // ms per brick away from where Mario lands

const MarioFrame = { Idle: 0, Walk: 1, Jump: 4 } as const
const MARIO_WALK_FRAMES = 3

// hidden → raging (arrow clicked into rage) → piping (sliding out of the tail) → falling → playing
type MarioPhase = 'hidden' | 'raging' | 'piping' | 'falling' | 'playing'

const marioPhase = ref<MarioPhase>('hidden')
const brickCount = ref(0) // enough to span the stage, set when it's measured
const brickLanding = ref<{ start: number; end: number } | null>(null) // bricks under Mario's feet; the row ripples out from here
const isArrowLocked = computed(() => marioPhase.value !== 'hidden') // upright and red from rage on, through its fade
const isArrowGone = computed(() => marioPhase.value === 'falling' || marioPhase.value === 'playing') // Mario's out of the tail
const prefersReducedMotion = useAtMedia('(prefers-reduced-motion: reduce)')

const marioSectionEl = ref<HTMLElement | null>(null) // lockup, arrow and bricks: Mario's keys work while any of it shows
const arrowEl = ref<HTMLElement | null>(null)
const arrowLiftEl = ref<HTMLElement | null>(null) // inside the button, so the lift doesn't fight the shake's translate
const lockup = ref<ComponentPublicInstance | null>(null)
const lockupEl = computed(() => lockup.value?.$el as HTMLElement | undefined)
const marioStageEl = ref<HTMLElement | null>(null)
const marioEl = ref<HTMLElement | null>(null)
const marioSheetEl = ref<HTMLElement | null>(null)

// Non-reactive: transforms are written straight to the DOM
const mario = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  facing: 1,
  frame: 0,
  animTimer: 0,
  walkFrame: 0,
  grounded: true,
  runTimer: 0,
  jump: MARIO_JUMP_STILL as (typeof MARIO_JUMPS)[number],
  isAirFast: false,
  ledge: null as [block: number, line: number] | null, // text line he's standing on; null for the bricks
}
const marioInput = { left: false, right: false, jump: false, run: false, jumpPressed: false, tapJump: false }
const marioStage = { width: 0, scale: 1 }

let isMarioVisible = false
let isMarioActive = false // arrows belong to Mario after the first ← / → while visible
let marioPipeEndY = 0
let marioRageTimeout: ReturnType<typeof setTimeout> | null = null
let marioRafId: number | null = null
let marioLastTime = 0
let marioAccumulator = 0
let marioStepCount = 0

// Lines of lockup text, in sprite px relative to the stage, running from cap height down to the baseline.
// One-way platforms: he passes up through them and lands on top. Only each block's last line is also a
// ceiling, so he bonks jumping from underneath but can jump in from the side and climb the ragged edge.
interface MarioLine {
  left: number
  right: number
  top: number
  bottom: number
}

let marioBlocks: MarioLine[][] = [] // lines per heading or paragraph, top to bottom
let marioBump: { node: Text; text: string; span: HTMLSpanElement; tail: Text; animation: Animation } | null = null
let marioCoins = 0
let marioSpentWord: HTMLSpanElement | null = null // left wrapped and faded once the coins run out

// Bricks away from the landing span; 0 for the ones he's standing on
const brickDistance = (index: number, { start, end }: { start: number; end: number }) =>
  Math.max(start - index, index - end, 0)

const MARIO_SOUNDS = {
  breakBlock: '/sounds/smb_breakblock.opus',
  bump: '/sounds/smb_bump.opus',
  coin: '/sounds/smb_coin.opus',
  jumpSmall: '/sounds/smb_jump-small.opus',
  pipe: '/sounds/smb_pipe.opus',
  powerup: '/sounds/smb_powerup.opus',
} as const

type MarioSound = keyof typeof MARIO_SOUNDS

const { play, isAudioOn } = useAudio()
const soundBoop = defineSound(boop)
const soundLevelUp = defineSound(levelUp)
const marioAudio: Partial<Record<MarioSound, HTMLAudioElement>> = {}

watch(
  isAudioOn,
  (on) => {
    if (!on || Object.keys(marioAudio).length) return

    for (const [name, src] of Object.entries(MARIO_SOUNDS) as [MarioSound, string][]) {
      const audio = new Audio(src)
      audio.preload = 'auto'
      marioAudio[name] = audio
    }
  },
  { immediate: true },
)

const playMarioSound = (name: MarioSound) => {
  const audio = marioAudio[name]
  if (!audio || !isAudioOn.value) return

  audio.currentTime = 0
  audio.play().catch(() => {})
}

const approach = (value: number, target: number, delta: number) =>
  value < target ? Math.min(value + delta, target) : Math.max(value - delta, target)

let metricsContext: CanvasRenderingContext2D | null = null

// Ascent and descent locate the baseline within a line rect; H's ink gives the cap height
const fontMetrics = (el: Element) => {
  const style = getComputedStyle(el)

  metricsContext ??= document.createElement('canvas').getContext('2d')
  if (!metricsContext) return { ascent: 0, descent: 0, cap: 0 }

  metricsContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const metrics = metricsContext.measureText('H')

  return {
    ascent: metrics.fontBoundingBoxAscent,
    descent: metrics.fontBoundingBoxDescent,
    cap: metrics.actualBoundingBoxAscent,
  }
}

const measureLines = (stage: DOMRect) => {
  if (!lockupEl.value) return

  const toX = (value: number) => (value - stage.left) / marioStage.scale
  const toY = (value: number) => (value - stage.top) / marioStage.scale
  const range = document.createRange()

  marioBlocks = [...lockupEl.value.querySelectorAll('h2, p')]
    .map((el) => {
      const lines: MarioLine[] = []
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)

      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.parentElement) continue

        const { ascent, descent, cap } = fontMetrics(node.parentElement)

        // Word by word, so spaces at line ends never count as platform
        for (const word of (node.textContent ?? '').matchAll(/\S+/g)) {
          range.setStart(node, word.index)
          range.setEnd(node, word.index + word[0].length)

          for (const rect of range.getClientRects()) {
            // Half-leading is split evenly, so the baseline sits the same distance from the centre either way
            const bottom = toY((rect.top + rect.bottom) / 2 + (ascent - descent) / 2)
            const top = bottom - cap / marioStage.scale
            const line = lines.find((line) => Math.abs(line.bottom - bottom) < 1)

            if (line) {
              line.left = Math.min(line.left, toX(rect.left))
              line.right = Math.max(line.right, toX(rect.right))
              line.top = Math.min(line.top, top)
            } else {
              lines.push({ left: toX(rect.left), right: toX(rect.right), top, bottom })
            }
          }
        }
      }

      return lines
    })
    .filter((lines) => lines.length)
}

const ledgeLine = () => (mario.ledge ? marioBlocks[mario.ledge[0]]?.[mario.ledge[1]] : undefined)

const measureMario = () => {
  if (!marioStageEl.value || !marioEl.value) return

  marioStage.scale = marioEl.value.offsetWidth / MARIO_SIZE
  marioStage.width = marioStageEl.value.clientWidth / marioStage.scale
  brickCount.value = Math.ceil(marioStage.width / MARIO_SIZE)

  measureLines(marioStageEl.value.getBoundingClientRect())

  // Text reflowed under his feet: stay on the same line, or fall if it's gone
  if (mario.ledge) {
    const line = ledgeLine()

    if (line) {
      mario.y = line.top
    } else {
      mario.ledge = null
      mario.grounded = false
    }
  }

  renderMario()
}

const caretAt = (x: number, y: number) => {
  if ('caretPositionFromPoint' in document) {
    const position = document.caretPositionFromPoint(x, y)
    return position && { node: position.offsetNode, offset: position.offset }
  }

  // Safari before 26.2
  const range = (document as Document).caretRangeFromPoint(x, y)
  return range && { node: range.startContainer, offset: range.startOffset }
}

const unbumpWord = () => {
  if (!marioBump) return

  const { node, text, span, tail, animation } = marioBump

  // Put the text node back exactly as Vue rendered it
  animation.cancel()
  span.remove()
  tail.remove()
  node.data = text
  marioBump = null
}

// Last text node of the copy's last paragraph, and where its last word ends
const coinWord = () => {
  const copy = lockupEl.value ? [...lockupEl.value.querySelectorAll('p')].at(-1) : undefined
  if (!copy) return null

  const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT)
  let last: Text | null = null

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Text && /\S/.test(node.data)) last = node
  }

  return last && { node: last, end: last.data.trimEnd().length }
}

// Pops the word at a stage point up and back, like a bonked block. The copy's last word is a coin block.
const bumpWord = (x: number, y: number) => {
  unbumpWord()

  if (!marioStageEl.value) return playMarioSound('bump')

  const stage = marioStageEl.value.getBoundingClientRect()
  const caret = caretAt(stage.left + x * marioStage.scale, stage.top + y * marioStage.scale)
  const node = caret?.node

  // A spent coin block just thuds
  if (!(node instanceof Text) || !lockupEl.value?.contains(node) || marioSpentWord?.contains(node))
    return playMarioSound('bump')

  const text = node.data
  let start = caret.offset
  let end = caret.offset

  while (start > 0 && /\S/.test(text[start - 1] ?? '')) start--
  while (end < text.length && /\S/.test(text[end] ?? '')) end++

  if (start === end) return playMarioSound('bump')

  const coin = coinWord()
  const isCoin = marioCoins < MARIO_COINS && coin?.node === node && coin.end === end
  const isSpent = isCoin && ++marioCoins === MARIO_COINS

  playMarioSound(isCoin ? 'coin' : 'bump')

  if (prefersReducedMotion.value && !isSpent) return

  const word = node.splitText(start)
  const tail = word.splitText(end - start)
  const span = document.createElement('span')

  span.className = isSpent ? 'inline-block opacity-60' : 'inline-block' // transforms don't apply to plain inline boxes
  word.replaceWith(span)
  span.append(word)

  const animation = prefersReducedMotion.value
    ? null
    : span.animate([{ translate: '0 0' }, { translate: `0 ${-MARIO_BUMP_HEIGHT}em` }, { translate: '0 0' }], {
        duration: MARIO_BUMP_DURATION,
      })

  // Spent: stays wrapped, so it keeps its fade
  if (isSpent) {
    marioSpentWord = span
    return
  }

  if (!animation) return

  animation.onfinish = unbumpWord
  marioBump = { node, text, span, tail, animation }
}

const collideLines = (prevFeet: number) => {
  const left = mario.x + MARIO_HITBOX_INSET
  const right = mario.x + MARIO_SIZE - MARIO_HITBOX_INSET
  const overlaps = (line: MarioLine) => right > line.left && left < line.right

  if (mario.y < prevFeet) {
    // Rising: the first ceiling crossed is the lowest
    const prevHead = prevFeet - MARIO_SIZE
    const head = mario.y - MARIO_SIZE
    let ceiling: MarioLine | undefined

    for (const lines of marioBlocks) {
      const line = lines.at(-1)

      if (
        line &&
        prevHead >= line.bottom &&
        head < line.bottom &&
        overlaps(line) &&
        line.bottom > (ceiling?.bottom ?? -Infinity)
      )
        ceiling = line
    }

    if (ceiling) {
      mario.y = ceiling.bottom + MARIO_SIZE
      mario.vy = 0
      bumpWord(
        Math.min(Math.max(mario.x + MARIO_SIZE / 2, ceiling.left), ceiling.right),
        (ceiling.top + ceiling.bottom) / 2,
      )
    }

    return
  }

  // Falling: land on the first top crossed
  let landing: [block: number, line: number] | null = null
  let landingTop = Infinity

  marioBlocks.forEach((lines, blockIndex) => {
    lines.forEach((line, lineIndex) => {
      if (prevFeet <= line.top && mario.y >= line.top && overlaps(line) && line.top < landingTop) {
        landing = [blockIndex, lineIndex]
        landingTop = line.top
      }
    })
  })

  if (landing) {
    mario.y = landingTop
    mario.vy = 0
    mario.grounded = true
    mario.ledge = landing
    marioInput.tapJump = false
  }
}

const startJump = (speed: number) => {
  mario.jump = MARIO_JUMPS.find((jump) => speed >= jump.from) ?? MARIO_JUMP_STILL
  mario.isAirFast = speed >= MARIO_AIR_FAST
}

const landMario = () => {
  const brickSize = MARIO_SIZE * marioStage.scale
  const rowOffset = (marioStage.width * marioStage.scale - brickCount.value * brickSize) / 2 // row is centred and clipped
  const left = Math.round(mario.x) * marioStage.scale - rowOffset // as rendered, snapped to sprite pixels
  const tolerance = marioStage.scale / 2 // half a sprite pixel, so rounding never claims a sliver of the next brick

  // Same width as a brick, so he stands on one or straddles two
  brickLanding.value = {
    start: Math.floor((left + tolerance) / brickSize),
    end: Math.floor((left + brickSize - tolerance) / brickSize),
  }
  marioPhase.value = 'playing'
  playMarioSound('breakBlock')
}

const stepPipe = () => {
  mario.y = Math.min(mario.y + MARIO_PIPE_SPEED, marioPipeEndY)
  mario.frame = MarioFrame.Idle

  if (mario.y === marioPipeEndY) marioPhase.value = 'falling'
}

const stepMario = () => {
  if (marioPhase.value === 'hidden' || marioPhase.value === 'raging') return
  if (marioPhase.value === 'piping') return stepPipe()

  // No control until he's landed from the pipe
  const isPlaying = marioPhase.value === 'playing'
  const direction = isPlaying ? Number(marioInput.right) - Number(marioInput.left) : 0
  const isRunning = isPlaying && marioInput.run
  const speed = Math.abs(mario.vx)
  const isForward = mario.vx === 0 || Math.sign(mario.vx) === direction

  if (isRunning) mario.runTimer = MARIO_RUN_HOLD
  else if (mario.runTimer > 0) mario.runTimer--

  if (mario.grounded) {
    const maxSpeed = mario.runTimer > 0 ? MARIO_RUN_SPEED : MARIO_WALK_SPEED

    if (direction === 0) {
      mario.vx = approach(mario.vx, 0, MARIO_RELEASE_DECEL)
    } else if (!isForward) {
      mario.vx = speed < MARIO_SKID_TURN ? 0 : approach(mario.vx, 0, MARIO_SKID_DECEL)
    } else if (speed > maxSpeed) {
      // Let go of B at full tilt: bleed back down to walk speed
      mario.vx = approach(mario.vx, direction * maxSpeed, MARIO_RELEASE_DECEL)
    } else if (speed < MARIO_MIN_WALK) {
      mario.vx = direction * MARIO_MIN_WALK
    } else {
      mario.vx = direction * Math.min(speed + (isRunning ? MARIO_RUN_ACCEL : MARIO_WALK_ACCEL), maxSpeed)
    }
  } else if (direction !== 0) {
    // No friction in the air: momentum only changes with input, capped by how fast he took off
    const maxSpeed = mario.isAirFast ? MARIO_RUN_SPEED : MARIO_WALK_SPEED

    if (isForward) {
      const accel = speed >= MARIO_WALK_SPEED ? MARIO_RUN_ACCEL : MARIO_WALK_ACCEL
      mario.vx = direction * Math.max(speed, Math.min(speed + accel, maxSpeed))
    } else {
      const decel =
        speed >= MARIO_WALK_SPEED ? MARIO_RUN_ACCEL : mario.isAirFast ? MARIO_RELEASE_DECEL : MARIO_WALK_ACCEL
      mario.vx = approach(mario.vx, direction * maxSpeed, decel)
    }
  }

  // Facing only turns on the ground, like the original
  if (mario.grounded && direction !== 0) mario.facing = direction

  // No buffering, like the original: A has to be pressed on the ground
  if (marioInput.jumpPressed && mario.grounded) {
    startJump(Math.abs(mario.vx))
    mario.vy = -mario.jump.velocity
    mario.grounded = false
    mario.ledge = null

    playMarioSound('jumpSmall') // NES picks the jump sound by size, not speed; he's small Mario
  }

  marioInput.jumpPressed = false

  if (!mario.grounded) {
    // Light gravity only while rising with A held; releasing early or starting to fall switches to heavy
    const isHeld = marioInput.jump || marioInput.tapJump
    mario.vy += mario.vy < 0 && isHeld ? mario.jump.gravityHeld : mario.jump.gravity
    if (mario.vy >= MARIO_FALL_SPEED) mario.vy = MARIO_FALL_RESET

    const prevFeet = mario.y
    mario.y += mario.vy

    if (isPlaying) collideLines(prevFeet)

    if (!mario.grounded && mario.y >= 0) {
      mario.y = 0
      mario.vy = 0
      mario.grounded = true
      marioInput.tapJump = false

      if (!isPlaying) landMario()
    }
  }

  mario.x += mario.vx

  // Ran off the end of a line
  const ledge = ledgeLine()
  if (
    ledge &&
    (mario.x + MARIO_SIZE - MARIO_HITBOX_INSET <= ledge.left || mario.x + MARIO_HITBOX_INSET >= ledge.right)
  ) {
    startJump(Math.abs(mario.vx))
    mario.ledge = null
    mario.grounded = false
    mario.vy = 0
  }

  // Wrap once fully off either edge
  const span = marioStage.width + MARIO_SIZE
  if (mario.x > marioStage.width) mario.x -= span
  else if (mario.x < -MARIO_SIZE) mario.x += span

  if (!mario.grounded) {
    mario.frame = MarioFrame.Jump
  } else if (mario.vx === 0) {
    mario.frame = MarioFrame.Idle
    mario.animTimer = 0
  } else {
    // Walk cycle steps through SMB's three speeds
    const animSpeed = Math.abs(mario.vx)
    const delay = animSpeed >= MARIO_ANIM_RUN ? 2 : animSpeed >= MARIO_ANIM_WALK ? 4 : 7

    if (mario.frame === MarioFrame.Idle || mario.frame === MarioFrame.Jump) {
      mario.animTimer = 0
    } else if (++mario.animTimer >= delay) {
      mario.walkFrame = (mario.walkFrame + 1) % MARIO_WALK_FRAMES
      mario.animTimer = 0
    }

    mario.frame = MarioFrame.Walk + mario.walkFrame
  }
}

const renderMario = () => {
  // Snap to whole sprite pixels
  const x = Math.round(mario.x) * marioStage.scale
  const y = Math.round(mario.y) * marioStage.scale

  if (marioEl.value) marioEl.value.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(${mario.facing})`
  if (marioSheetEl.value) marioSheetEl.value.style.transform = `translateX(${-mario.frame * 20}%)`
}

const tickMario = (time: number) => {
  marioAccumulator += Math.min(time - marioLastTime, MARIO_MAX_DT)
  marioLastTime = time

  while (marioAccumulator >= MARIO_STEP) {
    stepMario()
    marioAccumulator -= MARIO_STEP

    if (++marioStepCount % MARIO_RENDER_EVERY === 0) renderMario()
  }

  marioRafId = requestAnimationFrame(tickMario)
}

const startMario = () => {
  if (marioRafId !== null) return

  marioLastTime = performance.now()
  marioAccumulator = 0
  marioRafId = requestAnimationFrame(tickMario)
}

const stopMario = () => {
  if (marioRafId !== null) cancelAnimationFrame(marioRafId)
  marioRafId = null
}

const releaseMarioInput = () => {
  marioInput.left = false
  marioInput.right = false
  marioInput.jump = false
  marioInput.run = false
}

const onMarioTap = () => {
  if (marioPhase.value !== 'playing' || !mario.grounded) return

  marioInput.tapJump = true
  marioInput.jumpPressed = true
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

// A and B, with Z / X as the usual emulator layout
const MARIO_JUMP_KEYS = ['ArrowUp', ' ', 'x', 'X']
const MARIO_RUN_KEYS = ['Shift', 'z', 'Z']
const MARIO_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowDown', ...MARIO_JUMP_KEYS, ...MARIO_RUN_KEYS]

const onMarioKeyDown = (event: KeyboardEvent) => {
  if (
    marioPhase.value !== 'playing' ||
    !isMarioVisible ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    isTypingTarget(event.target)
  )
    return

  if (event.key === 'Escape') {
    isMarioActive = false
    releaseMarioInput()
    return
  }

  if (!isMarioActive) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    isMarioActive = true
    arrowEl.value?.blur() // in case a click refocused it after rage
  }

  if (!MARIO_KEYS.includes(event.key)) return

  event.preventDefault()

  if (event.key === 'ArrowLeft') marioInput.left = true
  if (event.key === 'ArrowRight') marioInput.right = true

  if (MARIO_RUN_KEYS.includes(event.key)) marioInput.run = true

  if (MARIO_JUMP_KEYS.includes(event.key)) {
    if (!event.repeat) marioInput.jumpPressed = true
    marioInput.jump = true
  }
}

const onMarioKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft') marioInput.left = false
  if (event.key === 'ArrowRight') marioInput.right = false
  if (MARIO_RUN_KEYS.includes(event.key)) marioInput.run = false
  if (MARIO_JUMP_KEYS.includes(event.key)) marioInput.jump = false
}

const startPipe = async () => {
  marioPhase.value = 'piping'

  // Wait for the shake to drop so the arrow is measured at rest
  await nextTick()
  measureMario()

  if (!arrowLiftEl.value || !marioStageEl.value) return

  const arrow = arrowLiftEl.value.getBoundingClientRect()
  const stage = marioStageEl.value.getBoundingClientRect()

  // Feet start at the tail mouth, so he begins hidden behind the arrow
  mario.x = (arrow.left + arrow.width * ARROW_TAIL_X - stage.left) / marioStage.scale - MARIO_SIZE / 2
  mario.y = Math.floor((arrow.top + arrow.height * ARROW_TAIL_BOTTOM - stage.top) / marioStage.scale)
  mario.vx = 0
  mario.vy = 0
  mario.facing = 1
  mario.grounded = false
  mario.jump = MARIO_JUMP_STILL
  mario.runTimer = 0
  mario.ledge = null
  marioPipeEndY = mario.y + MARIO_SIZE

  renderMario()
  playMarioSound('pipe')
}

const { shakeClass: arrowShakeClass, click: rageArrow } = useRageClicks({
  onClick: () => play(soundBoop),
  onRage: () => {
    marioPhase.value = 'raging'
    arrowEl.value?.blur() // it's done; otherwise Mario's arrow keys light up its focus ring
    play(soundLevelUp)
    marioRageTimeout = setTimeout(startPipe, MARIO_RAGE_HOLD)
  },
})

const onArrowClick = () => {
  if (marioPhase.value === 'hidden') rageArrow()
}

// tabindex="-1" still lets a click focus it, so stray clicks after rage would bring the ring back
const onArrowMouseDown = (event: MouseEvent) => {
  if (marioPhase.value !== 'hidden') event.preventDefault()
}

useEventListener(window, 'keydown', onMarioKeyDown)
useEventListener(window, 'keyup', onMarioKeyUp)
useEventListener(window, 'blur', releaseMarioInput)

useResizeObserver([marioStageEl, lockupEl], measureMario)

onMounted(() => {
  document.fonts.ready.then(measureMario)
})

useIntersectionObserver(marioSectionEl, ([entry]) => {
  isMarioVisible = entry?.isIntersecting ?? false

  if (isMarioVisible) {
    startMario()
  } else {
    // Hand the arrows back to the page once the section scrolls away
    isMarioActive = false
    releaseMarioInput()
    stopMario()
  }
})

onUnmounted(() => {
  stopMario()
  unbumpWord()
  if (marioRageTimeout) clearTimeout(marioRageTimeout)
  Object.values(marioAudio).forEach((audio) => audio.pause())
})
</script>

<template>
  <div
    v-editable="block"
    class="flex flex-col gap-(--app-gutter-outer) overflow-clip"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div
      ref="marioSectionEl"
      class="flex flex-col gap-(--app-gutter-outer)"
    >
      <div class="wrapper grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-5">
        <UiLockup
          ref="lockup"
          class="col-span-full md:col-span-8"
          :heading="block.heading"
          :copy="block.copy"
        />

        <div class="col-span-full md:col-span-4">
          <button
            ref="arrowEl"
            type="button"
            class="relative z-1 block w-30 md:w-40 mx-auto transition-opacity duration-300 ease-outCubic"
            :class="[
              marioPhase === 'raging' ? 'shake-3' : arrowShakeClass,
              { 'cursor-default': marioPhase !== 'hidden', 'opacity-0 pointer-events-none': isArrowGone },
            ]"
            aria-label="Poke the arrow"
            :tabindex="marioPhase === 'hidden' ? undefined : -1"
            :aria-disabled="marioPhase !== 'hidden' || undefined"
            @mousedown="onArrowMouseDown"
            @click="onArrowClick"
          >
            <!-- On mobile it lifts clear on rage, so Mario has room to come out of the tail -->
            <div
              ref="arrowLiftEl"
              :class="{
                'transition-scale duration-150 ease-out hover:scale-102 active:scale-98': marioPhase === 'hidden',
                'max-md:-translate-y-20 transition-transform duration-300 ease-outCubic': isArrowLocked,
              }"
            >
              <!-- Tail doubles as a pipe: upright and red while raging, until Mario is out -->
              <IconPixelArrow
                class="w-full data-rage:[&_[fill='#24F456']]:fill-rage-light data-rage:[&_[fill='#00E640']]:fill-rage data-rage:[&_[fill='#00C340']]:fill-rage-dark"
                :class="{ 'animate-bob': !isArrowLocked }"
                :data-rage="isArrowLocked || undefined"
                :style="{ transform: `rotate(${isArrowLocked ? 0 : rotation}deg)` }"
              />
            </div>
          </button>
        </div>
      </div>

      <div
        ref="marioStageEl"
        class="relative -mt-[calc(var(--app-gutter-outer)*1.5)] md:mt-[calc(var(--app-gutter-outer)*0.5)] lg:mt-0"
        aria-hidden="true"
      >
        <div
          ref="marioEl"
          class="absolute bottom-full left-0 size-10 md:size-12 overflow-hidden touch-manipulation select-none"
          :class="{ invisible: marioPhase === 'hidden' || marioPhase === 'raging' }"
          @pointerdown="onMarioTap"
        >
          <div
            ref="marioSheetEl"
            class="h-full w-max"
          >
            <IconMarioSequence
              class="h-full w-auto"
              shape-rendering="crispEdges"
            />
          </div>
        </div>

        <!-- Sized up front: bricks only render once the stage is measured -->
        <div class="flex justify-center h-10 md:h-12 overflow-x-clip">
          <IconMarioBrick
            v-for="(_, index) in brickCount"
            :key="index"
            class="size-10 md:size-12 shrink-0 motion-reduce:[--brick-rise:0]"
            :class="[
              brickLanding === null ? 'opacity-0' : 'animate-brick-in',
              { '[--brick-rise:0]': brickLanding !== null && brickDistance(index, brickLanding) === 0 },
            ]"
            :style="
              brickLanding === null || prefersReducedMotion
                ? undefined
                : { animationDelay: `${brickDistance(index, brickLanding) * BRICK_RIPPLE_DELAY}ms` }
            "
          />
        </div>
      </div>
    </div>

    <div class="wrapper flex flex-col gap-(--app-gutter-outer)">
      <div
        v-for="(step, index) in block.steps"
        v-editable="step"
        :key="step._uid"
        class="sticky top-0 h-svh flex flex-col items-center justify-center max-md:px-(--app-gutter-outer)"
      >
        <div
          class="w-full flex flex-col gap-[calc(var(--app-gutter-outer)*2)] md:gap-(--app-gutter-outer)"
          :class="{
            'items-center': true,
            'md:items-start': index === 0,
            'md:items-center': index === 1 || index > 2,
            'md:items-end': index === 2,
          }"
        >
          <div
            ref="card"
            class="max-w-120"
            :style="{
              paddingTop: `calc(var(--app-gutter-outer) * ${index})`,
            }"
          >
            <CardStep
              :number="`0${index + 1}`.slice(-2)"
              :title="step.title"
              :heading="step.heading"
              :copy="step.copy"
              :theme="'theme' in step ? (step.theme as Themes) : undefined"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
