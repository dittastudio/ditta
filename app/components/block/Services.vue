<script lang="ts" setup>
import { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint, Events, Sleeping } from 'matter-js'
import { useEventListener } from '@vueuse/core'
import { defineSound } from '@web-kits/audio'
import { sync } from '@@/.web-kits/core'
import { useAppStore } from '@/stores/app'
import type { Block } from '#storyblok-schema'

interface Props {
  block: Block<'block_services'>
}

const { block } = defineProps<Props>()

const containerRef = useTemplateRef('container')
const chipRefs = useTemplateRef('chipRef')
const computerRef = useTemplateRef('computer')
const ready = ref(false)
const isDragging = ref(false)

const resetDrag = () => {
  isDragging.value = false
}

const services = await useDatasource('services', block.services)

const soundClick = defineSound(sync)
const { play, isAudioOn } = useAudio()

const preloadedImgs = new Set<string>()

const preloadImg = (src: string) => {
  if (preloadedImgs.has(src)) return
  preloadedImgs.add(src)
  const img = new Image()
  img.src = src
}

const sounds = {
  error: defineSample('/sounds/winxperror.opus'),
  restart: defineSample('/sounds/winxpstartup.opus'),
  ps: defineSample('/sounds/ps-startup.opus'),
  nintendo: defineSample('/sounds/nintendo-startup.opus'),
  epicSax: defineSample('/sounds/epicsaxguy.opus'),
}

let jazzInterval: ReturnType<typeof setInterval> | null = null

watch(isAudioOn, (on) => on && sounds.error.load(), { immediate: true })

const appStore = useAppStore()

const rageCount = ref(0)
const rageScreen = ref('/imgs/blue-screen.svg')

let rageTimeout: ReturnType<typeof setTimeout> | null = null
let psScreenTimeout: ReturnType<typeof setTimeout> | null = null

const preloadNextRage = () => {
  preloadImg('/imgs/blue-screen.svg')
  const upcoming = (rageCount.value + 1) % 4
  if (upcoming === 1) {
    preloadImg('/imgs/windowsxp-screen.svg')
    if (isAudioOn.value) sounds.restart.load()
  } else if (upcoming === 2) {
    preloadImg('/imgs/ps-screen-1.svg')
    preloadImg('/imgs/ps-screen-2.svg')
    if (isAudioOn.value) sounds.ps.load()
  } else if (upcoming === 3) {
    preloadImg('/imgs/nintendo-screen.svg')
    if (isAudioOn.value) sounds.nintendo.load()
  } else {
    preloadImg('/imgs/jazz-1.svg')
    preloadImg('/imgs/jazz-2.svg')
    if (isAudioOn.value) sounds.epicSax.load()
  }
}

const onRage = () => {
  rageScreen.value = '/imgs/blue-screen.svg'
  void sounds.error.play()

  if (!isAudioOn.value) {
    rageTimeout = setTimeout(resetRage, RAGE_SILENT_HOLD)
    return
  }

  rageCount.value++
  const sequence = rageCount.value % 4

  // Each boot screen stays up for as long as its sound plays
  rageTimeout = setTimeout(async () => {
    if (sequence === 1) {
      rageScreen.value = '/imgs/windowsxp-screen.svg'
      await sounds.restart.play()
    } else if (sequence === 2) {
      rageScreen.value = '/imgs/ps-screen-1.svg'
      psScreenTimeout = setTimeout(() => {
        rageScreen.value = '/imgs/ps-screen-2.svg'
      }, 7200)
      await sounds.ps.play()
      clearTimeout(psScreenTimeout)
    } else if (sequence === 3) {
      rageScreen.value = '/imgs/nintendo-screen.svg'
      await sounds.nintendo.play()
    } else {
      let jazzToggle = false

      rageScreen.value = '/imgs/jazz-1.svg'
      jazzInterval = setInterval(() => {
        jazzToggle = !jazzToggle
        rageScreen.value = jazzToggle ? '/imgs/jazz-2.svg' : '/imgs/jazz-1.svg'
      }, 465)
      await sounds.epicSax.play()
      clearInterval(jazzInterval)
    }

    resetRage()
  }, 2000)
}

const {
  inRage,
  shakeClass,
  click: onComputerClick,
  resetRage,
} = useRageClicks({
  onFirstClick: preloadNextRage,
  onClick: () => {
    appStore.cycleAccent()
    play(soundClick)
  },
  onRage,
})

let stopObserving: (() => void) | null = null
let stopSimulation: (() => void) | null = null

const PHYSICS_START_RATIO = 0.1
const pad = 100

function buildWalls(w: number, h: number) {
  return [
    Bodies.rectangle(w / 2, h + pad / 2, w + pad * 2, pad, { isStatic: true }),
    Bodies.rectangle(w / 2, -pad / 2, w + pad * 2, pad, { isStatic: true }),
    Bodies.rectangle(-pad / 2, h / 2, pad, h + pad * 2, { isStatic: true }),
    Bodies.rectangle(w + pad / 2, h / 2, pad, h + pad * 2, { isStatic: true }),
  ]
}

function chipSize(chip: HTMLElement) {
  return { w: chip.offsetWidth, h: chip.offsetHeight }
}

function makeChipBody(x: number, y: number, w: number, h: number) {
  return Bodies.rectangle(x, y, w, h, {
    chamfer: { radius: h / 2 },
    restitution: 0.8,
    friction: 0.01,
    frictionAir: 0.01,
  })
}

// Written straight to the element, so moving the mouse doesn't re-render the block
const onMouseMove = (event: MouseEvent) => {
  const rotation = (event.clientX / window.innerWidth) * 80 - 40

  computerRef.value?.$el.style.setProperty('transform', `rotate(${rotation}deg)`)
}

// While the page is moving, a swipe that lands on a chip carries on scrolling rather than stopping dead on it
const PAGE_SCROLL_SETTLE = 300
const pageScrolling = ref(false)

let pageScrollTimeout: ReturnType<typeof setTimeout> | null = null

const onPageScroll = () => {
  pageScrolling.value = true
  if (pageScrollTimeout) clearTimeout(pageScrollTimeout)
  pageScrollTimeout = setTimeout(() => {
    pageScrolling.value = false
  }, PAGE_SCROLL_SETTLE)
}

// Everything per-frame or per-input stops while the section is off screen
const sectionVisible = ref(false)

useEventListener(() => (sectionVisible.value ? window : null), 'mousemove', onMouseMove, { passive: true })
useEventListener(() => (sectionVisible.value ? window : null), 'scroll', onPageScroll, { passive: true })

onMounted(() => {
  window.addEventListener('pointerup', resetDrag, { passive: true })

  const el = containerRef.value
  const chips = chipRefs.value

  if (!el) return

  const sizes = chips?.map(chipSize) ?? []
  const canSimulate = !!chips?.length && sizes.every(({ w, h }) => w > 0 && h > 0)

  let pausePhysics: (() => void) | null = null
  let resumePhysics: (() => void) | null = null

  const startPhysics = (chips: HTMLElement[]) => {
    const { width, height } = el.getBoundingClientRect()
    let worldW = width
    let worldH = height
    const engine = Engine.create({ gravity: { x: 0, y: 0.5 }, enableSleeping: true })
    let walls = buildWalls(width, height)

    Composite.add(engine.world, walls)

    const cols = Math.ceil(Math.sqrt(sizes.length * (width / height)))
    const rows = Math.ceil(sizes.length / cols)

    const bodies = sizes.map(({ w, h }, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = (col * width) / cols + width / cols / 2 + (Math.random() - 0.5) * 40
      const y = (row * height) / rows + height / rows / 2 + (Math.random() - 0.5) * 40
      const body = makeChipBody(x, y, w, h)
      Body.setAngle(body, (Math.random() - 0.5) * Math.PI * 0.4)
      Body.setVelocity(body, { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 })
      return body
    })

    Composite.add(engine.world, bodies)

    const mouse = Mouse.create(el)
    // Not in matter-js's typings
    const { mousedown, mousemove, mouseup, mousewheel } = mouse as unknown as Record<
      'mousedown' | 'mousemove' | 'mouseup' | 'mousewheel',
      (event: unknown) => void
    >

    // matter-js registers these with passive: false and calls preventDefault on every wheel and touch, wherever it
    // lands — remove them so page scroll works
    el.removeEventListener('wheel', mousewheel)
    el.removeEventListener('touchstart', mousedown)
    el.removeEventListener('touchmove', mousemove)
    el.removeEventListener('touchend', mouseup)

    // Only a touch that starts on a chip reaches matter-js, as a mouse. Anything else is left to scroll the page, and
    // can't pick up a chip that passes under the finger on the way. touch-action in the template stops a chip's touch
    // from panning.
    let chipTouchId: number | null = null

    const asMouse = ({ pageX, pageY }: Touch) => ({ pageX, pageY, button: 0 })
    const chipTouch = (event: TouchEvent) => [...event.changedTouches].find((t) => t.identifier === chipTouchId)

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0]

      if (!touch || chipTouchId !== null || pageScrolling.value) return
      if (!(event.target instanceof Element && event.target.closest('li'))) return

      chipTouchId = touch.identifier
      mousedown(asMouse(touch))
    }

    const onTouchMove = (event: TouchEvent) => {
      const touch = chipTouch(event)

      if (touch) mousemove(asMouse(touch))
    }

    const onTouchEnd = (event: TouchEvent) => {
      const touch = chipTouch(event)

      if (!touch) return

      chipTouchId = null
      mouseup(asMouse(touch))
    }

    const touchListeners = new AbortController()
    const touchOptions = { passive: true, signal: touchListeners.signal }

    el.addEventListener('touchstart', onTouchStart, touchOptions)
    el.addEventListener('touchmove', onTouchMove, touchOptions)
    el.addEventListener('touchend', onTouchEnd, touchOptions)
    el.addEventListener('touchcancel', onTouchEnd, touchOptions)

    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.15, damping: 0.1 },
    })
    Composite.add(engine.world, mouseConstraint)

    Events.on(mouseConstraint, 'startdrag', () => {
      isDragging.value = true
    })
    Events.on(mouseConstraint, 'enddrag', () => {
      isDragging.value = false
    })

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]

      if (!entry) return

      const { width: newW, height: newH } = entry.contentRect

      // Fires as soon as it starts observing, and a rebuild drops any chip being dragged
      if (Math.abs(newW - worldW) < 1 && Math.abs(newH - worldH) < 1) return

      worldW = newW
      worldH = newH

      walls.forEach((wall) => Composite.remove(engine.world, wall))
      walls = buildWalls(newW, newH)
      Composite.add(engine.world, walls)

      chips.forEach((chip, i) => {
        const { w, h } = chipSize(chip)
        if (w === 0 || h === 0) return
        const old = bodies[i]
        if (!old) return
        const newBody = makeChipBody(
          Math.max(w / 2, Math.min(newW - w / 2, old.position.x)),
          Math.max(h / 2, Math.min(newH - h / 2, old.position.y)),
          w,
          h,
        )
        Body.setAngle(newBody, old.angle)
        Body.setVelocity(newBody, old.velocity)
        Composite.remove(engine.world, old)
        Composite.add(engine.world, newBody)
        bodies[i] = newBody
        sizes[i] = { w, h }
      })

      // A chip's transform depends on its size, which may have changed without it moving
      poses.fill(NaN)
    })

    resizeObserver.observe(el)

    const runner = Runner.create()

    let raf = 0

    // Written straight to the elements, so a frame doesn't re-render the block. x, y, angle per chip, to skip any that
    // haven't moved.
    const poses = new Float64Array(bodies.length * 3).fill(NaN)

    const render = () => {
      bodies.forEach(({ position: { x, y }, angle }, i) => {
        const chip = chips[i]
        const size = sizes[i]
        const offset = i * 3

        if (!chip || !size) return
        if (poses[offset] === x && poses[offset + 1] === y && poses[offset + 2] === angle) return

        poses[offset] = x
        poses[offset + 1] = y
        poses[offset + 2] = angle
        chip.style.transform = `translate(${x - size.w / 2}px, ${y - size.h / 2}px) rotate(${angle}rad)`
      })
    }

    // Runner.tick copes with the gap after a pause, so the world carries on from where it stopped
    const tick = (time: number) => {
      // A sleeping chip wouldn't notice its support being pulled away slowly, and would be left hanging in mid-air
      if (mouseConstraint.body) bodies.forEach((body) => Sleeping.set(body, false))

      Runner.tick(runner, engine, time)
      render()
      raf = requestAnimationFrame(tick)
    }

    pausePhysics = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    resumePhysics = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    render()
    resumePhysics()
    ready.value = true

    stopSimulation = () => {
      pausePhysics?.()
      Engine.clear(engine)
      resizeObserver.disconnect()
      touchListeners.abort()
    }
  }

  // Start once a little of the section shows, so the chips are seen falling. Pause only when it's fully gone.
  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return

      sectionVisible.value = entry.isIntersecting

      if (!entry.isIntersecting) {
        pausePhysics?.()
      } else if (resumePhysics) {
        resumePhysics()
      } else if (canSimulate && chips && entry.intersectionRatio >= PHYSICS_START_RATIO) {
        startPhysics(chips)
      }
    },
    { threshold: [0, PHYSICS_START_RATIO] },
  )

  intersectionObserver.observe(el)

  stopObserving = () => intersectionObserver.disconnect()
})

onUnmounted(() => {
  window.removeEventListener('pointerup', resetDrag)
  stopObserving?.()
  stopSimulation?.()
  if (pageScrollTimeout) clearTimeout(pageScrollTimeout)
  if (rageTimeout) clearTimeout(rageTimeout)
  if (psScreenTimeout) clearTimeout(psScreenTimeout)
  if (jazzInterval) clearInterval(jazzInterval)
})
</script>

<template>
  <div
    v-editable="block"
    class="relative overflow-hidden"
  >
    <div
      class="relative wrapper z-1 pointer-events-none"
      :class="{
        'pt-(--app-vertical-rhythm)': block.spacing_top,
        'pb-(--app-vertical-rhythm)': block.spacing_bottom,
      }"
    >
      <div
        :class="isDragging ? '*:pointer-events-none' : '*:pointer-events-auto'"
        class="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-5 pb-80"
      >
        <UiLockup
          class="col-span-full md:col-span-8"
          :heading="block.heading"
          :copy="block.copy"
        />

        <div class="col-span-full md:col-span-4">
          <div
            class="w-50 md:w-62.5 mx-auto md:ml-auto"
            :class="shakeClass"
          >
            <IconComputer
              ref="computer"
              class="tappable animate-bob w-full text-accent cursor-pointer"
              :class="{ 'transition-[scale,transform] duration-150 ease-out hover:scale-102 active:scale-98': !inRage }"
              :in-rage="inRage"
              :screen-src="rageScreen"
              @mousedown.prevent
              @click="onComputerClick"
            />
          </div>
        </div>
      </div>
    </div>

    <ul
      ref="container"
      class="absolute inset-0 z-0 select-none touch-pan-y touch-pinch-zoom"
    >
      <!-- iOS ignores touch-action unless it's on the very element touched, hence **: -->
      <li
        v-for="service in services"
        :key="service.id"
        ref="chipRef"
        class="absolute top-0 left-0 rounded-full touch-pinch-zoom **:touch-pinch-zoom will-change-transform transition-opacity duration-500"
        :class="[ready ? 'opacity-100' : 'opacity-0', { 'touch-pan-y **:touch-pan-y': pageScrolling }]"
      >
        <UiChip
          v-memo="[service.name]"
          :text="service.name"
          size="large"
          theme="light"
        />
      </li>
    </ul>
  </div>
</template>
