import type { Alien } from '@/utils/mario/alien'
import type { Camera } from '@/utils/mario/camera'
import type { Blocks, Box, Hooks, Ledge, Line } from '@/utils/mario/physics'
import type { EffectScope, MaybeRefOrGetter } from 'vue'
import { useEventListener, useIntersectionObserver, useResizeObserver } from '@vueuse/core'

import { ALIEN_HEIGHT, ALIEN_WIDTH, createAlien, isTouching, settleAlien, stepAlien } from '@/utils/mario/alien'
import { createCamera, stepCamera } from '@/utils/mario/camera'
import { COIN_WIDTH } from '@/utils/mario/coin'
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

// hidden → raging (pipe clicked into rage) → piping (sliding out of it) → falling → playing → dying (the alien got
// him) → resetting (the scene clears away) → hidden again
export type MarioPhase = 'hidden' | 'raging' | 'piping' | 'falling' | 'playing' | 'dying' | 'resetting'

type Target = MaybeRefOrGetter<HTMLElement | null | undefined>

export type MarioButton = 'left' | 'right' | 'jump'

// Unseen until first hit, then a ? box until the next, then spent
export type MarioBoxState = 'hidden' | 'question' | 'empty'

interface Elements {
  section: Target // Mario's keys work while any of it shows
  stage: Target // bricks run along its top edge
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
const BUMP_HEIGHT = 0.15 // em
const BOX_GAP = SIZE * 2 // sprite px from the heading's cap height up to the box, room for a hop from its first line
const BOX_BUMP_HEIGHT = 4 // sprite px
const COINS = 10 // like a multi-coin block, the copy's last word pays out this many before it's spent
const MAX_FLYING_COINS = 3 // SMB's jumping coin slots; past that the oldest goes
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

let metricsContext: CanvasRenderingContext2D | null = null
const metricsCache = new Map<string, { ascent: number; descent: number; cap: number }>() // by font

// Ascent and descent locate the baseline within a line rect; H's ink gives the cap height
const fontMetrics = (el: Element) => {
  const style = getComputedStyle(el)
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const cached = metricsCache.get(font)
  if (cached) return cached

  metricsContext ??= document.createElement('canvas').getContext('2d')
  if (!metricsContext) return { ascent: 0, descent: 0, cap: 0 }

  metricsContext.font = font
  const metrics = metricsContext.measureText('H')
  const result = {
    ascent: metrics.fontBoundingBoxAscent,
    descent: metrics.fontBoundingBoxDescent,
    cap: metrics.actualBoundingBoxAscent,
  }

  metricsCache.set(font, result)
  return result
}

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

const caretAt = (x: number, y: number) => {
  if ('caretPositionFromPoint' in document) {
    const position = document.caretPositionFromPoint(x, y)
    return position && { node: position.offsetNode, offset: position.offset }
  }

  // Safari before 26.2
  const range = (document as Document).caretRangeFromPoint(x, y)
  return range && { node: range.startContainer, offset: range.startOffset }
}

// Mario platforming across a block's text and a row of bricks, out of a pipe that rages first
export default function useMario(el: Elements) {
  const phase = ref<MarioPhase>('hidden')
  const brickCount = ref(0) // enough to span the stage, set when it's measured
  const landing = ref<{ start: number; end: number } | null>(null) // bricks under his feet; the row ripples out from here
  const isVisible = ref(false)
  const box = ref<Box | null>(null) // over the heading, so none without one
  const boxState = ref<MarioBoxState>('hidden')
  const flyingCoins = ref<{ id: number; x: number; y: number }[]>([]) // screen px from the stage's top left
  const hasAlien = ref(false)
  const isPlayable = computed(() => phase.value === 'playing' && isVisible.value)
  const prefersReducedMotion = useAtMedia('(prefers-reduced-motion: reduce)')
  const lenis = useLenis() // the page's smooth scrolling: the camera scrolls through it, so the two never fight
  const isEditor = storyblokEditor(useRoute().query) // Vue re-renders the copy there, so leave its DOM alone

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
  let scope: EffectScope | undefined
  let hasKeys = false // arrows belong to Mario after the first ← / → while visible
  let pipeMouth = 0
  let rageTimeout: ReturnType<typeof setTimeout> | undefined
  let rafId: number | null = null
  let lastTime = 0
  let accumulator = 0
  let stepCount = 0
  let bump: { node: Text; text: string; span: HTMLSpanElement; tail: Text; animation: Animation } | null = null
  let coins = 0
  let spent: { node: Text; text: string; span: HTMLSpanElement; tail: Text } | null = null // wrapped and faded once the coins run out
  let coinId = 0
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
    const lockup = toValue(el.lockup)
    if (!lockup) return

    const toX = (value: number) => (value - stageRect.left) / stage.scale
    const toY = (value: number) => (value - stageRect.top) / stage.scale
    const range = document.createRange()

    const elements = [...lockup.querySelectorAll('h2, p')]
    const measured = elements.map((block) => {
      const lines: Line[] = []
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)

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
            const top = bottom - cap / stage.scale
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

    const heading = measured[elements.findIndex((element) => element.tagName === 'H2')] ?? []

    // From its top left, snapped to whole sprite px like Mario's drawing so the two line up
    box.value = heading.length
      ? {
          left: Math.round(Math.min(...heading.map((line) => line.left))),
          top: Math.round(Math.min(...heading.map((line) => line.top))) - BOX_GAP - SIZE,
        }
      : null

    blocks = measured.filter((lines) => lines.length)
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

  const unbumpWord = () => {
    if (!bump) return

    const { node, text, span, tail, animation } = bump

    // Put the text node back exactly as Vue rendered it
    animation.cancel()
    span.remove()
    tail.remove()
    node.data = text
    bump = null
  }

  const unspendWord = () => {
    if (!spent) return
    const { node, text, span, tail } = spent
    span.remove()
    tail.remove()
    node.data = text
    spent = null
  }

  // Last text node of the copy's last paragraph, and where its last word ends
  const coinWord = () => {
    const copy = [...(toValue(el.lockup)?.querySelectorAll('p') ?? [])].at(-1)
    if (!copy) return null

    const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT)
    let last: Text | null = null

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node instanceof Text && /\S/.test(node.data)) last = node
    }

    return last && { node: last, end: last.data.trimEnd().length }
  }

  // Out of the word, centred on it with its bottom on the baseline
  const popCoin = (word: HTMLSpanElement, stageRect: DOMRect) => {
    const rect = word.getBoundingClientRect()
    const { ascent, descent } = fontMetrics(word)
    const baseline = (rect.top + rect.bottom) / 2 + (ascent - descent) / 2

    flyingCoins.value = [
      ...flyingCoins.value.slice(1 - MAX_FLYING_COINS),
      {
        id: coinId++,
        x: (rect.left + rect.right) / 2 - (COIN_WIDTH / 2) * stage.scale - stageRect.left,
        y: baseline - SIZE * stage.scale - stageRect.top,
      },
    ]
  }

  const removeCoin = (id: number) => {
    flyingCoins.value = flyingCoins.value.filter((coin) => coin.id !== id)
  }

  // Pops the word at a stage point up and back, like a bonked block. The copy's last word is a coin block.
  const bumpWord = (x: number, y: number) => {
    unbumpWord()

    const stageEl = toValue(el.stage)
    if (isEditor || !stageEl) return playSound('bump')

    const stageRect = stageEl.getBoundingClientRect()
    const caret = caretAt(stageRect.left + x * stage.scale, stageRect.top + y * stage.scale)
    const node = caret?.node

    // A spent coin block just thuds
    if (!caret || !(node instanceof Text) || !toValue(el.lockup)?.contains(node) || spent?.span.contains(node))
      return playSound('bump')

    const text = node.data
    let start = caret.offset
    let end = caret.offset

    while (start > 0 && /\S/.test(text[start - 1] ?? '')) start--
    while (end < text.length && /\S/.test(text[end] ?? '')) end++

    if (start === end) return playSound('bump')

    const coin = coinWord()
    const isCoin = coins < COINS && coin?.node === node && coin.end === end
    const isSpent = isCoin && ++coins === COINS

    playSound(isCoin ? 'coin' : 'bump')

    if (prefersReducedMotion.value && !isSpent) return

    const word = node.splitText(start)
    const tail = word.splitText(end - start)
    const span = document.createElement('span')

    // Inline-block, as transforms don't apply to plain inline boxes. Layered over the stage, so the coin comes out from
    // behind this word but passes in front of the rest.
    span.className = isSpent ? 'relative z-1 inline-block opacity-50' : 'relative z-1 inline-block'
    word.replaceWith(span)
    span.append(word)

    if (isCoin && !prefersReducedMotion.value) popCoin(span, stageRect)

    const animation = prefersReducedMotion.value
      ? null
      : span.animate([{ translate: '0 0' }, { translate: `0 ${-BUMP_HEIGHT}em` }, { translate: '0 0' }], {
          duration: BUMP_DURATION,
        })

    // Spent: stays wrapped, so it keeps its fade
    if (isSpent) {
      spent = { node, text, span, tail }
      return
    }

    if (!animation) return

    animation.onfinish = unbumpWord
    bump = { node, text, span, tail, animation }
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
    if (phase.value !== 'playing') return step(mario, noInput, [], null, stage.width, hooks)

    step(mario, input, blocks, box.value, stage.width, hooks)
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
    unbumpWord()
    unspendWord()
    hasKeys = false
    releaseInput()
    alien = null
    hasAlien.value = false
    marioLedge = null
    camera = null
    coins = 0
    landing.value = null
    boxState.value = 'hidden'
    flyingCoins.value = []
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
    unbumpWord()
    hasAlien.value = false
    clearTimeout(rageTimeout)
    clearTimeout(resetTimeout)
  })

  return { phase, isPlayable, bricks, box, boxState, flyingCoins, removeCoin, hasAlien, start, press, release }
}
