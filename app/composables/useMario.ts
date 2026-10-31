import type { Blocks, Hooks, Line } from '@/utils/mario/physics'
import type { EffectScope, MaybeRefOrGetter } from 'vue'
import { useEventListener, useIntersectionObserver, useResizeObserver } from '@vueuse/core'

import { SIZE, STEP, createInput, createMario, enterPipe, settleOnLedge, step, stepPipe } from '@/utils/mario/physics'

// hidden → raging (pipe clicked into rage) → piping (sliding out of it) → falling → playing
export type MarioPhase = 'hidden' | 'raging' | 'piping' | 'falling' | 'playing'

type Target = MaybeRefOrGetter<HTMLElement | null | undefined>

export type MarioButton = 'left' | 'right' | 'jump'

interface Elements {
  section: Target // Mario's keys work while any of it shows
  stage: Target // bricks run along its top edge
  sprite: Target
  sheet: Target
  lockup: Target // its headings and paragraphs are platforms
  pipe: Target // the pixel arrow, at rest
}

const RAGE_HOLD = 700 // ms the pipe rages before Mario drops out
const MAX_DT = 100 // ms; clamp tab-switch gaps
const RENDER_EVERY = 2 // physics frames per redraw, for ~30fps choppiness

// Pipe mouth as a fraction of the pixel-arrow viewBox (110 × 134)
const PIPE_MOUTH_X = 55 / 110
const PIPE_MOUTH_Y = 130 / 134

const BUMP_DURATION = 150 // ms for a bonked word to pop up and back
const BUMP_HEIGHT = 0.15 // em
const COINS = 10 // like a multi-coin block, the copy's last word pays out this many before it's spent
const BRICK_RIPPLE_DELAY = 25 // ms per brick away from where Mario lands

const SOUNDS = {
  breakBlock: '/sounds/smb_breakblock.opus',
  bump: '/sounds/smb_bump.opus',
  coin: '/sounds/smb_coin.opus',
  jumpSmall: '/sounds/smb_jump-small.opus',
  pipe: '/sounds/smb_pipe.opus',
  powerup: '/sounds/smb_powerup.opus',
} as const

type Sound = keyof typeof SOUNDS

// A and B, with Z / X as the usual emulator layout
const JUMP_KEYS = new Set(['ArrowUp', ' ', 'x', 'X'])
const RUN_KEYS = new Set(['Shift', 'z', 'Z'])
const KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', ...JUMP_KEYS, ...RUN_KEYS])

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

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
  const isPlayable = computed(() => phase.value === 'playing' && isVisible.value)
  const prefersReducedMotion = useAtMedia('(prefers-reduced-motion: reduce)')
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
  const stage = { width: 0, scale: 1 } // width in sprite px; scale is screen px per sprite px

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
  let spentWord: HTMLSpanElement | null = null // left wrapped and faded once the coins run out

  const { isAudioOn } = useAudio()
  const audio: Partial<Record<Sound, HTMLAudioElement>> = {}

  watch(
    isAudioOn,
    (on) => {
      if (!on || Object.keys(audio).length) return

      for (const [name, src] of Object.entries(SOUNDS) as [Sound, string][]) {
        audio[name] = new Audio(src)
        audio[name].preload = 'auto'
      }
    },
    { immediate: true },
  )

  const playSound = (name: Sound) => {
    const sound = audio[name]
    if (!sound || !isAudioOn.value) return

    sound.currentTime = 0
    sound.play().catch(() => {})
  }

  const measureLines = (stageRect: DOMRect) => {
    const lockup = toValue(el.lockup)
    if (!lockup) return

    const toX = (value: number) => (value - stageRect.left) / stage.scale
    const toY = (value: number) => (value - stageRect.top) / stage.scale
    const range = document.createRange()

    blocks = [...lockup.querySelectorAll('h2, p')]
      .map((block) => {
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
      .filter((lines) => lines.length)
  }

  const render = () => {
    const sprite = toValue(el.sprite)
    const sheet = toValue(el.sheet)

    // Snap to whole sprite pixels
    const x = Math.round(mario.x) * stage.scale
    const y = Math.round(mario.y) * stage.scale

    if (sprite) sprite.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(${mario.facing})`
    if (sheet) sheet.style.transform = `translate3d(${-mario.frame * SIZE * stage.scale}px, 0, 0)`
  }

  const measure = () => {
    const stageEl = toValue(el.stage)
    const sprite = toValue(el.sprite)
    if (!stageEl || !sprite) return

    stage.scale = sprite.offsetWidth / SIZE
    stage.width = stageEl.clientWidth / stage.scale
    brickCount.value = Math.ceil(stage.width / SIZE)

    measureLines(stageEl.getBoundingClientRect())
    settleOnLedge(mario, blocks)
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

  // Pops the word at a stage point up and back, like a bonked block. The copy's last word is a coin block.
  const bumpWord = (x: number, y: number) => {
    unbumpWord()

    const stageEl = toValue(el.stage)
    if (isEditor || !stageEl) return playSound('bump')

    const stageRect = stageEl.getBoundingClientRect()
    const caret = caretAt(stageRect.left + x * stage.scale, stageRect.top + y * stage.scale)
    const node = caret?.node

    // A spent coin block just thuds
    if (!caret || !(node instanceof Text) || !toValue(el.lockup)?.contains(node) || spentWord?.contains(node))
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

    span.className = isSpent ? 'inline-block opacity-60' : 'inline-block' // transforms don't apply to plain inline boxes
    word.replaceWith(span)
    span.append(word)

    const animation = prefersReducedMotion.value
      ? null
      : span.animate([{ translate: '0 0' }, { translate: `0 ${-BUMP_HEIGHT}em` }, { translate: '0 0' }], {
          duration: BUMP_DURATION,
        })

    // Spent: stays wrapped, so it keeps its fade
    if (isSpent) {
      spentWord = span
      return
    }

    if (!animation) return

    animation.onfinish = unbumpWord
    bump = { node, text, span, tail, animation }
  }

  // Out of the pipe and onto the bricks: control starts here
  const land = () => {
    const brickSize = SIZE * stage.scale
    const rowOffset = (stage.width * stage.scale - brickCount.value * brickSize) / 2 // row is centred and clipped
    const left = Math.round(mario.x) * stage.scale - rowOffset // as rendered, snapped to sprite pixels
    const tolerance = stage.scale / 2 // half a sprite pixel, so rounding never claims a sliver of the next brick

    // Same width as a brick, so he stands on one or straddles two
    landing.value = {
      start: Math.floor((left + tolerance) / brickSize),
      end: Math.floor((left + brickSize - tolerance) / brickSize),
    }
    phase.value = 'playing'
    playSound('breakBlock')
  }

  const hooks: Hooks = {
    onJump: () => playSound('jumpSmall'), // NES picks the jump sound by size, not speed; he's small Mario
    onBump: bumpWord,
    onFloor: () => {
      if (phase.value === 'falling') land()
    },
  }

  const advance = () => {
    if (phase.value === 'piping') {
      if (stepPipe(mario, pipeMouth)) phase.value = 'falling'
      return
    }

    // No control, and nothing to land on but the bricks, until he's out of the pipe
    if (phase.value === 'playing') step(mario, input, blocks, stage.width, hooks)
    else step(mario, noInput, [], stage.width, hooks)
  }

  const tick = (time: number) => {
    accumulator += Math.min(time - lastTime, MAX_DT)
    lastTime = time

    while (accumulator >= STEP) {
      advance()
      accumulator -= STEP

      if (++stepCount % RENDER_EVERY === 0) render()
    }

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

  const start = () => {
    if (phase.value !== 'hidden') return

    phase.value = 'raging'
    rageTimeout = setTimeout(enter, RAGE_HOLD)
  }

  onScopeDispose(() => {
    scope?.stop()
    stopLoop()
    unbumpWord()
    clearTimeout(rageTimeout)
    Object.values(audio).forEach((sound) => sound.pause())
  })

  return { phase, isPlayable, bricks, start, press, release }
}
