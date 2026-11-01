<script lang="ts" setup>
import { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint, Events } from 'matter-js'
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
const transforms = shallowRef<string[]>([])
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

let stopPhysics: (() => void) | null = null

const pad = 100

function buildWalls(w: number, h: number) {
  return [
    Bodies.rectangle(w / 2, h + pad / 2, w + pad * 2, pad, { isStatic: true }),
    Bodies.rectangle(w / 2, -pad / 2, w + pad * 2, pad, { isStatic: true }),
    Bodies.rectangle(-pad / 2, h / 2, pad, h + pad * 2, { isStatic: true }),
    Bodies.rectangle(w + pad / 2, h / 2, pad, h + pad * 2, { isStatic: true }),
  ]
}

function chipSize(chip: Element) {
  const el = chip as HTMLElement
  return { w: el.offsetWidth, h: el.offsetHeight }
}

function makeChipBody(x: number, y: number, w: number, h: number) {
  return Bodies.rectangle(x, y, w, h, {
    chamfer: { radius: h / 2 },
    restitution: 0.8,
    friction: 0.01,
    frictionAir: 0.01,
  })
}

const rotation = ref(0)

const onMouseMove = (event: MouseEvent) => {
  rotation.value = (event.clientX / window.innerWidth) * 80 - 40
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('pointerup', resetDrag, { passive: true })

  const el = containerRef.value
  const chips = chipRefs.value

  if (!el || !chips?.length) return

  const sizes = chips.map(chipSize)

  if (sizes.some(({ w, h }) => w === 0 || h === 0)) return

  const startPhysics = () => {
    const { width, height } = el.getBoundingClientRect()
    const engine = Engine.create({ gravity: { x: 0, y: 0.5 } })
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
    // matter-js registers 'wheel' with passive: false and calls preventDefault — remove it so page scroll works
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mouse.element.removeEventListener('wheel', (mouse as any).mousewheel as EventListener)

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
    })

    resizeObserver.observe(el)

    const runner = Runner.create()
    Runner.run(runner, engine)

    let raf: number

    const tick = () => {
      transforms.value = bodies.map(({ position: { x, y }, angle }, i) => {
        const size = sizes[i]
        if (!size) return ''
        return `translate(${x - size.w / 2}px, ${y - size.h / 2}px) rotate(${angle}rad)`
      })
      raf = requestAnimationFrame(tick)
    }

    tick()
    ready.value = true

    stopPhysics = () => {
      cancelAnimationFrame(raf)
      Runner.stop(runner)
      Engine.clear(engine)
      resizeObserver.disconnect()
    }
  }

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        intersectionObserver.disconnect()
        startPhysics()
      }
    },
    { threshold: 0.1 },
  )

  intersectionObserver.observe(el)

  stopPhysics = () => intersectionObserver.disconnect()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('pointerup', resetDrag)
  stopPhysics?.()
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
        class="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-5 relativex pb-80"
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
              class="animate-bob w-full text-accent cursor-pointer"
              :class="{ 'transition-[scale,transform] duration-150 ease-out hover:scale-102 active:scale-98': !inRage }"
              :style="{ transform: `rotate(${rotation}deg)` }"
              :in-rage="inRage"
              :screen-src="rageScreen"
              @click="onComputerClick"
            />
          </div>
        </div>
      </div>
    </div>

    <ul
      ref="container"
      class="absolute inset-0 z-0 select-none"
    >
      <li
        v-for="(service, i) in services"
        :key="service.id"
        ref="chipRef"
        class="absolute top-0 left-0 will-change-transform transition-opacity duration-500"
        :class="ready ? 'opacity-100' : 'opacity-0'"
        :style="transforms[i] ? { transform: transforms[i] } : {}"
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
