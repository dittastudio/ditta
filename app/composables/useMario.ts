import type { Alien } from '@/utils/mario/alien'
import type { Camera } from '@/utils/mario/camera'
import type { Blocks, Box, Hooks, Ledge } from '@/utils/mario/physics'
import type { EffectScope, MaybeRefOrGetter } from 'vue'
import { useEventListener, useIntersectionObserver, useResizeObserver } from '@vueuse/core'

import { ALIEN_HEIGHT, ALIEN_WIDTH, createAlien, isTouching, settleAlien, stepAlien } from '@/utils/mario/alien'
import { createCamera, stepCamera } from '@/utils/mario/camera'
import {
  SIZE,
  STEP,
  catchMario,
  createInput,
  createMario,
  enterPipe,
  settleOnLedge,
  startDeath,
  step,
  stepDeath,
  stepPipe,
} from '@/utils/mario/physics'
import { measureTextPlatforms } from '@/utils/mario/textPlatforms'

// hidden → raging (pipe clicked into rage) → piping (sliding out of it) → falling → playing → dying (the alien got
// him) → resetting (the scene clears away) → hidden again
export type MarioPhase = 'hidden' | 'raging' | 'piping' | 'falling' | 'playing' | 'dying' | 'resetting'

export type Target = MaybeRefOrGetter<HTMLElement | null | undefined>

export type MarioButton = 'left' | 'right' | 'jump'

// Unseen until first hit, then a ? box until the next, then spent
export type MarioBoxState = 'hidden' | 'question' | 'empty'

interface Elements {
  section: Target // Mario's keys work while any of it shows
  stage: Target // bricks run along its top edge
  ceiling: Target // he can't jump past its top edge, where the block clips him
  sprite: Target
  sheet: Target
  lockup: Target // its headings and paragraphs are platforms
  box: Target // the hidden box over the heading
  pipe: Target // the pixel arrow, at rest
  alien: Target
  alienSheet: Target
  gamepad: Target // over the bottom of touch screens; the camera keeps him above it
}

const RAGE_HOLD = 700 // ms the pipe rages before Mario drops out
const MAX_DT = 100 // ms; clamp tab-switch gaps
const RENDER_EVERY = 2 // physics frames per redraw, for ~30fps choppiness

// Pipe mouth as a fraction of the pixel-arrow viewBox (110 × 134)
const PIPE_MOUTH_X = 55 / 110
const PIPE_MOUTH_Y = 130 / 134

const BUMP_DURATION = 150 // ms for a bonked word to pop up and back
const BOX_GAP = SIZE * 2 // sprite px from the heading's cap height up to the box, room for a hop from its first line
const BOX_BUMP_HEIGHT = 4 // sprite px
const BRICK_RIPPLE_DELAY = 25 // ms per brick away from where Mario lands
const BRICK_OUT_DURATION = 300 // ms, --animate-brick-out
const DEATH_FREEZE = 30 // frames everything holds still once the alien touches him
const SCREECH_INTERVAL_MIN = 240 // frames, 4s: long enough to clear its 3.7s screech and the sounds it comes out to
const SCREECH_INTERVAL_MAX = 480 // 8s

// A and B, with Z / X as the usual emulator layout
const JUMP_KEYS = new Set(['ArrowUp', ' ', 'x', 'X'])
const RUN_KEYS = new Set(['Shift', 'z', 'Z'])
const KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', ...JUMP_KEYS, ...RUN_KEYS])

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

// Writes only what changed, so a frame where nothing moved costs no style work
const styleCache = new WeakMap<HTMLElement, Record<string, string>>()

const setStyle = (el: HTMLElement | null | undefined, property: 'transform' | 'clipPath', value: string) => {
  if (!el) return
  const last = styleCache.get(el) ?? {}
  if (last[property] === value) return
  last[property] = value
  styleCache.set(el, last)
  el.style[property] = value
}

// Mario platforming across a block's text and a row of bricks, out of a pipe that rages first
export default function useMario(el: Elements) {
  const phase = ref<MarioPhase>('hidden')
  const brickCount = ref(0) // enough to span the stage, set when it's measured
  const landing = ref<{ start: number; end: number } | null>(null) // bricks under his feet; the row ripples out from here
  const isVisible = ref(false)
  const box = ref<Box | null>(null) // over the heading, so none without one
  const boxState = ref<MarioBoxState>('hidden')
  const hasAlien = ref(false)
  const isPlayable = computed(() => phase.value === 'playing' && isVisible.value)
  // The section only gets watched once he's on his way out, and a rage only happens with the arrow in view
  const isOnScreen = computed(() => phase.value === 'raging' || (phase.value !== 'hidden' && isVisible.value))
  const prefersReducedMotion = useAtMedia('(prefers-reduced-motion: reduce)')
  const lenis = useLenis() // the page's smooth scrolling: the camera scrolls through it, so the two never fight

  // null until he lands, then each brick's place in the ripple
  const bricks = computed(() => {
    const span = landing.value

    return Array.from({ length: brickCount.value }, (_, index) => {
      if (!span) return null

      const distance = Math.max(span.start - index, index - span.end, 0)

      return {
        isUnder: distance === 0,
        delay: prefersReducedMotion.value ? undefined : `${distance * BRICK_RIPPLE_DELAY}ms`,
      }
    })
  })

  // Non-reactive: the loop writes transforms straight to the DOM
  const mario = createMario()
  const input = createInput()
  const noInput = createInput() // falling out of the pipe, before he's under control
  // width in sprite px; scale is screen px per sprite px; origin is the stage's top left in page px
  const stage = { width: 0, scale: 1, dpr: 1, originX: 0, originY: 0 }
  // Read on resize, not every frame, as each read would make the browser lay out the page there and then
  const view = { height: 0, maxScroll: 0 } // visible height, above the gamepad on touch screens

  let blocks: Blocks = []
  let roof = -Infinity // sprite px, measured from the ceiling element
  let scope: EffectScope | undefined
  let hasKeys = false // arrows belong to Mario after the first ← / → while visible
  let pipeMouth = 0
  let rageTimeout: ReturnType<typeof setTimeout> | undefined
  let rafId: number | null = null
  let lastTime = 0
  let accumulator = 0
  let stepCount = 0
  let alien: Alien | null = null
  let marioLedge: Ledge | null = null // his last surface, null for the bricks; a jump from it still counts
  let deathFrames = 0
  let screechFrames = 0 // until the alien next screeches
  let deathX = 0 // where he was caught, for the bricks to clear away from
  let resetTimeout: ReturnType<typeof setTimeout> | undefined
  let camera: Camera | null = null // from when he lands

  const { isAudioOn } = useAudio()
  const sounds = {
    breakBlock: defineSample('/sounds/smb_breakblock.opus'),
    bump: defineSample('/sounds/smb_bump.opus'),
    coin: defineSample('/sounds/smb_coin.opus'),
    powerupAppears: defineSample('/sounds/smb_powerup_appears.opus'),
    die: defineSample('/sounds/smb_mariodie.opus'),
    jumpSmall: defineSample('/sounds/smb_jump-small.opus'),
    pipe: defineSample('/sounds/smb_pipe.opus'),
  }

  const playSound = (name: keyof typeof sounds) => void sounds[name].play()

  const { flyingCoins, removeCoin, bumpWord, resetWords } = useMarioWords({
    stage: el.stage,
    lockup: el.lockup,
    scale: () => stage.scale,
    playSound,
  })

  // Fetched once the pipe rages, and only with audio on
  const loadSounds = () => {
    if (phase.value !== 'hidden' && isAudioOn.value) Object.values(sounds).forEach((sound) => sound.load())
  }

  watch(isAudioOn, loadSounds)

  // Kept out of the rest: most never get as far as the alien, so they're fetched only once the ? box is one hit from it
  const alienSounds = {
    entrance: defineSample('/sounds/cotgdw.opus'),
    screech: defineSample('/sounds/xenomorph-screech.opus'),
  }

  watch([isAudioOn, boxState], ([on, state]) => {
    if (on && state !== 'hidden') Object.values(alienSounds).forEach((sound) => sound.load())
  })

  const nextScreech = () => SCREECH_INTERVAL_MIN + Math.random() * (SCREECH_INTERVAL_MAX - SCREECH_INTERVAL_MIN)

  const playAlienEntrance = async () => {
    await sounds.powerupAppears.play()
    // Not if the scene's gone in the meantime, or it's already got him
    if (hasAlien.value && phase.value === 'playing') await alienSounds.entrance.play()
  }

  const measureLines = (stageRect: DOMRect) => {
    const ceiling = toValue(el.ceiling)
    // Rounded down the screen, so his head never reaches the clip
    if (ceiling) roof = Math.ceil((ceiling.getBoundingClientRect().top - stageRect.top) / stage.scale)

    const lockup = toValue(el.lockup)
    if (!lockup) return

    const measured = measureTextPlatforms(lockup, stageRect, stage.scale)
    const { heading } = measured

    // From its top left, snapped to whole sprite px like Mario's drawing so the two line up
    box.value = heading.length
      ? {
          left: Math.round(Math.min(...heading.map((line) => line.left))),
          top: Math.round(Math.min(...heading.map((line) => line.top))) - BOX_GAP - SIZE,
        }
      : null

    blocks = measured.blocks
  }

  // Sprite px to screen px, snapped to whole sprite pixels and then onto the device pixel grid. On mobile a sprite pixel
  // is 2.5 screen px, so unsnapped edges land between device pixels: the sprite shimmers and its window bleeds a
  // sliver of the next frame.
  const toScreen = (value: number, origin: number) =>
    Math.round((Math.round(value) * stage.scale + origin) * stage.dpr) / stage.dpr - origin

  const render = () => {
    const x = toScreen(mario.x, stage.originX)
    const y = toScreen(mario.y, stage.originY)

    setStyle(toValue(el.sprite), 'transform', `translate3d(${x}px, ${y}px, 0) scaleX(${mario.facing})`)
    setStyle(toValue(el.sheet), 'transform', `translate3d(${-mario.frame * SIZE * stage.scale}px, 0, 0)`)

    const alienEl = toValue(el.alien)
    if (!alien || !alienEl) return

    const alienY = Math.round(alien.y)
    // Facing left in the sheet; clipped at the box's top while it's still rising out of it
    const sunk = alien.depth > 0 && box.value ? alienY - box.value.top : 0
    const alienX = toScreen(alien.x, stage.originX)
    setStyle(
      alienEl,
      'transform',
      `translate3d(${alienX}px, ${toScreen(alienY, stage.originY)}px, 0) scaleX(${-alien.direction})`,
    )
    setStyle(alienEl, 'clipPath', sunk > 0 ? `inset(0 0 ${(sunk / ALIEN_HEIGHT) * 100}% 0)` : '')
    setStyle(toValue(el.alienSheet), 'transform', `translate3d(${-alien.frame * ALIEN_WIDTH * stage.scale}px, 0, 0)`)
  }

  // Where the stage sits on the page and how much of the page shows: cheap enough for every resize, scroll-bar
  // included, and enough for the camera and the drawing to never read layout per frame
  const measureView = () => {
    const stageEl = toValue(el.stage)
    if (!stageEl) return

    const stageRect = stageEl.getBoundingClientRect()
    const viewport = window.visualViewport?.height ?? window.innerHeight // steady as the address bar shows and hides

    stage.dpr = window.devicePixelRatio || 1
    stage.originX = stageRect.left + window.scrollX
    stage.originY = stageRect.top + window.scrollY
    view.height = viewport - (toValue(el.gamepad)?.offsetHeight ?? 0) // none on desktop, where it isn't shown
    view.maxScroll = document.documentElement.scrollHeight - viewport
    return stageRect
  }

  const measure = () => {
    const stageEl = toValue(el.stage)
    const sprite = toValue(el.sprite)
    if (!stageEl || !sprite) return

    const stageRect = measureView()
    if (!stageRect) return

    stage.scale = sprite.offsetWidth / SIZE
    stage.width = stageEl.clientWidth / stage.scale
    brickCount.value = Math.ceil(stage.width / SIZE)

    measureLines(stageRect)
    settleOnLedge(mario, blocks, box.value)
    if (alien) settleAlien(alien, blocks, box.value)
    render()
  }

  // Hidden, then a ? box, then spent: each hit before that shows the next, with a bounce
  const bumpBox = () => {
    if (boxState.value === 'empty') return playSound('bump')

    const isRevealing = boxState.value === 'hidden'

    if (isRevealing) playSound('bump')
    else void playAlienEntrance()

    boxState.value = isRevealing ? 'question' : 'empty'

    if (!isRevealing && box.value) {
      alien = createAlien(box.value, !prefersReducedMotion.value)
      screechFrames = nextScreech()
      hasAlien.value = true
    }

    if (prefersReducedMotion.value) return

    toValue(el.box)?.animate(
      [{ translate: '0 0' }, { translate: `0 ${(-BOX_BUMP_HEIGHT / SIZE) * 100}%` }, { translate: '0 0' }],
      { duration: BUMP_DURATION },
    )
  }

  // Bricks under a Mario-wide span at x: the same width as a brick, so one or a straddled two
  const bricksUnder = (x: number) => {
    const brickSize = SIZE * stage.scale
    const rowOffset = (stage.width * stage.scale - brickCount.value * brickSize) / 2 // row is centred and clipped
    const left = Math.round(x) * stage.scale - rowOffset // as rendered, snapped to sprite pixels
    const tolerance = stage.scale / 2 // half a sprite pixel, so rounding never claims a sliver of the next brick

    return {
      start: Math.floor((left + tolerance) / brickSize),
      end: Math.floor((left + brickSize - tolerance) / brickSize),
    }
  }

  // Out of the pipe and onto the bricks: control starts here
  const land = () => {
    landing.value = bricksUnder(mario.x)
    phase.value = 'playing'
    playSound('breakBlock')

    // Moving the page on its own is what reduced motion asks to avoid
    if (!prefersReducedMotion.value) camera = createCamera(window.scrollY)
  }

  // Every display frame, not every redraw, so the scroll stays smooth while he stays choppy. Stops dead when the
  // alien gets him, so he falls out of a still screen.
  const followMario = () => {
    if (!camera || phase.value !== 'playing') return

    const toPage = (y: number, height: number) => ({
      top: stage.originY + (y - height) * stage.scale,
      bottom: stage.originY + y * stage.scale,
    })

    const top = stepCamera(camera, {
      scroll: window.scrollY,
      height: view.height,
      maxScroll: view.maxScroll,
      mario: toPage(mario.y, SIZE),
      alien: alien && toPage(alien.y, ALIEN_HEIGHT),
      grounded: mario.grounded,
      ledge: mario.ledge,
    })

    if (top === null) return
    if (lenis.value) lenis.value.scrollTo(top, { immediate: true, force: true })
    else window.scrollTo({ top, behavior: 'instant' })
  }

  const hooks: Hooks = {
    onJump: () => playSound('jumpSmall'), // NES picks the jump sound by size, not speed; he's small Mario
    onBump: bumpWord,
    onBumpBox: bumpBox,
    onBumpRoof: () => playSound('bump'),
    onFloor: () => {
      if (phase.value === 'falling') land()
    },
  }

  // Everything holds still, then he hops and drops out of the world, and the scene clears away
  const die = () => {
    phase.value = 'dying'
    deathFrames = 0
    Object.values(alienSounds).forEach((sound) => sound.stop())
    deathX = mario.x
    catchMario(mario)
    render()
    hasKeys = false
    releaseInput()
  }

  const advanceDeath = () => {
    if (++deathFrames < DEATH_FREEZE) return

    if (deathFrames === DEATH_FREEZE) {
      startDeath(mario)
      playSound('die')
      return
    }

    stepDeath(mario)

    // All the way out of the bottom of the viewport, wherever it's scrolled to
    if (stage.originY - window.scrollY + (mario.y - SIZE) * stage.scale > window.innerHeight) clearScene()
  }

  const advance = () => {
    if (phase.value === 'piping') {
      if (stepPipe(mario, pipeMouth)) phase.value = 'falling'
      return
    }

    if (phase.value === 'dying') return advanceDeath()
    if (phase.value === 'resetting') return

    // No control, and nothing to land on but the bricks, until he's out of the pipe
    if (phase.value !== 'playing') return step(mario, noInput, [], null, -Infinity, stage.width, hooks)

    step(mario, input, blocks, box.value, roof, stage.width, hooks)
    if (mario.grounded) marioLedge = mario.ledge

    if (!alien) return
    stepAlien(alien, blocks, box.value, stage.width, { x: mario.x + SIZE / 2, ledge: marioLedge })
    if (isTouching(alien, mario)) return die()

    // Counted in game frames, so it pauses with the loop when the stage is scrolled away
    if (--screechFrames <= 0) {
      screechFrames = nextScreech()
      void alienSounds.screech.play()
    }
  }

  const tick = (time: number) => {
    accumulator += Math.min(time - lastTime, MAX_DT)
    lastTime = time

    while (accumulator >= STEP) {
      advance()
      accumulator -= STEP

      if (++stepCount % RENDER_EVERY === 0) render()
    }

    followMario()

    rafId = requestAnimationFrame(tick)
  }

  const startLoop = () => {
    if (rafId !== null) return

    lastTime = performance.now()
    accumulator = 0
    rafId = requestAnimationFrame(tick)
  }

  const stopLoop = () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
  }

  const releaseInput = () => Object.assign(input, createInput())

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isPlayable.value || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return

    if (event.key === 'Escape') {
      hasKeys = false
      releaseInput()
      return
    }

    if (!hasKeys) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      hasKeys = true
    }

    if (!KEYS.has(event.key)) return

    event.preventDefault()

    if (event.key === 'ArrowLeft') input.left = true
    if (event.key === 'ArrowRight') input.right = true
    if (RUN_KEYS.has(event.key)) input.run = true

    if (JUMP_KEYS.has(event.key)) {
      if (!event.repeat) input.jumpPressed = true
      input.jump = true
    }
  }

  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') input.left = false
    if (event.key === 'ArrowRight') input.right = false
    if (RUN_KEYS.has(event.key)) input.run = false
    if (JUMP_KEYS.has(event.key)) input.jump = false
  }

  // On-screen gamepad
  const press = (button: MarioButton) => {
    if (!isPlayable.value) return

    if (button === 'jump') {
      input.jumpPressed = true
      input.jump = true
    } else {
      input[button] = true
    }
  }

  const release = (button: MarioButton) => {
    input[button] = false
  }

  // Everything that only matters once Mario is out, in a scope of its own so it can all stop together
  const listen = () => {
    scope = effectScope(true)
    scope.run(() => {
      useEventListener(window, 'keydown', onKeyDown)
      useEventListener(window, 'keyup', onKeyUp)
      useEventListener(window, 'blur', releaseInput)
      useResizeObserver([() => toValue(el.stage), () => toValue(el.lockup)], measure)
      // Anything above growing or shrinking moves the stage, and the page's height with it
      useResizeObserver([() => document.body, () => toValue(el.gamepad)], measureView)
      useEventListener(() => window.visualViewport, 'resize', measureView)

      useIntersectionObserver(
        () => toValue(el.section),
        ([entry]) => {
          isVisible.value = entry?.isIntersecting ?? false

          if (isVisible.value) {
            startLoop()
          } else {
            // Hand the arrows back to the page once the section scrolls away
            hasKeys = false
            releaseInput()
            stopLoop()
          }
        },
      )
    })
  }

  const enter = async () => {
    phase.value = 'piping'

    // Wait for the rage shake to drop so the pipe is measured at rest
    await nextTick()
    measure()
    listen()

    const pipe = toValue(el.pipe)
    const stageEl = toValue(el.stage)
    if (!pipe || !stageEl) return

    const pipeRect = pipe.getBoundingClientRect()
    const stageRect = stageEl.getBoundingClientRect()

    // Feet start at the pipe mouth, so he begins hidden behind it
    pipeMouth = Math.floor((pipeRect.top + pipeRect.height * PIPE_MOUTH_Y - stageRect.top) / stage.scale)
    enterPipe(
      mario,
      (pipeRect.left + pipeRect.width * PIPE_MOUTH_X - stageRect.left) / stage.scale - SIZE / 2,
      pipeMouth,
    )

    render()
    playSound('pipe')
  }

  // Back to before the rage: no bricks, no Mario, no box or alien, the copy as Vue rendered it
  const reset = () => {
    scope?.stop()
    scope = undefined
    stopLoop()
    resetWords()
    hasKeys = false
    releaseInput()
    alien = null
    hasAlien.value = false
    marioLedge = null
    camera = null
    landing.value = null
    boxState.value = 'hidden'
    isVisible.value = false
    phase.value = 'hidden'
  }

  // The bricks ripple away from where he was caught, as the rest fades
  const clearScene = () => {
    phase.value = 'resetting'
    landing.value = bricksUnder(deathX)
    flyingCoins.value = []

    const { start, end } = landing.value
    const furthest = Math.max(start, brickCount.value - 1 - end, 0)
    const ripple = prefersReducedMotion.value ? 0 : furthest * BRICK_RIPPLE_DELAY

    resetTimeout = setTimeout(reset, ripple + BRICK_OUT_DURATION)
  }

  const start = () => {
    if (phase.value !== 'hidden') return

    phase.value = 'raging'
    loadSounds()
    rageTimeout = setTimeout(enter, RAGE_HOLD)
  }

  onScopeDispose(() => {
    scope?.stop()
    stopLoop()
    hasAlien.value = false
    clearTimeout(rageTimeout)
    clearTimeout(resetTimeout)
  })

  return {
    phase,
    isPlayable,
    isOnScreen,
    bricks,
    box,
    boxState,
    flyingCoins,
    removeCoin,
    hasAlien,
    start,
    press,
    release,
  }
}
