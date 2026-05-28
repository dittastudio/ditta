<script lang="ts" setup>
import { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint, Events } from 'matter-js'
import { defineSound } from '@web-kits/audio'
import { sync } from '@@/.web-kits/core'
import { useAppStore } from '@/stores/app'
import type { Accent } from '@/stores/app'
import type { BlockServices } from '#storyblok-components'

interface Props {
  block: BlockServices
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

let audioError: HTMLAudioElement | null = null
let audioRestart: HTMLAudioElement | null = null

watch(
  isAudioOn,
  (on) => {
    if (!on || audioError) return

    audioError = new Audio('/sounds/winxperror.opus')
    audioError.preload = 'auto'
    audioRestart = new Audio('/sounds/winxpstartup.opus')
    audioRestart.preload = 'auto'
  },
  { immediate: true },
)

const soundError = () => {
  if (audioError) {
    audioError.currentTime = 0
    audioError.play().catch(() => {})
  }
}
const soundRestart = () => {
  if (audioRestart) {
    audioRestart.currentTime = 0
    audioRestart.play().catch(() => {})
  }
}

const accents: Accent[] = ['pink', 'mood', 'olive']
const appStore = useAppStore()

const clickTimes: number[] = []
const inRage = ref(false)
let rageTimeout: ReturnType<typeof setTimeout> | null = null

const onComputerClick = () => {
  if (inRage.value) return

  const now = Date.now()
  clickTimes.push(now)

  const cutoff = now - 1500
  while (clickTimes.length && clickTimes[0]! < cutoff) clickTimes.shift()

  if (clickTimes.length >= 7) {
    clickTimes.length = 0
    inRage.value = true
    play(soundError)

    rageTimeout = setTimeout(() => {
      play(soundRestart)
      inRage.value = false
    }, 2000)

    return
  }

  const next = (accents.indexOf(appStore.accent) + 1) % accents.length
  appStore.setAccent(accents[next]!)
  play(soundClick)
}

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
  window.addEventListener('pointerup', resetDrag)

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
})

// const wrapper = useTemplateRef('wrapper')

// const chipsActive = () => {
//   wrapper.value?.classList.add('pointer-events-none')
// }

// const chipsInactive = () => {
//   wrapper.value?.classList.remove('pointer-events-none')
// }
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
      <div class="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-5 relativex pb-80">
        <UiLockup
          class="col-span-full md:col-span-8 *:pointer-events-auto"
          :class="isDragging ? '*:pointer-events-none' : '*:pointer-events-auto'"
          :heading="block.heading"
          :copy="block.copy"
        />

        <div class="col-span-full md:col-span-4">
          <IconComputer
            class="animate-bob w-50 md:w-60 mx-auto md:ml-auto text-accent cursor-pointer"
            :class="isDragging ? 'pointer-events-none' : 'pointer-events-auto'"
            :style="{ transform: `rotate(${rotation}deg)` }"
            @click="onComputerClick"
          >
            <template v-if="!inRage">
              <path
                d="M86 225H66v-9h20v9z"
                fill="#0F0"
              />
              <path
                d="M86 233H66v-8h20v8z"
                fill="#009A01"
              />
              <path
                d="M95 57h111v74H95V57z"
                fill="currentColor"
              />
              <path
                d="M180.249 131.336c-4.41 0-7.686-2.226-7.686-6.174 0-4.452 3.864-6.636 8.484-7.098l4.536-.462c1.176-.126 1.806-.882 1.806-1.89 0-1.176-1.218-2.184-3.318-2.184-2.268 0-3.864 1.134-4.2 3.108h-5.964c.588-4.746 5.418-7.77 10.29-7.77 6.258 0 9.996 3.612 8.988 9.45l-1.092 6.216c-.126.756.084 1.512 1.008 1.512.294 0 .546-.042.756-.084l-.882 5.04c-.546.168-1.302.294-2.352.294-2.226 0-3.906-1.176-4.032-2.688-.882 1.596-3.402 2.73-6.342 2.73zm.756-4.536c2.94 0 4.914-1.932 5.46-4.662l.126-.756-4.83.672c-1.89.252-3.192 1.302-3.192 2.814 0 1.176.882 1.932 2.436 1.932zM166.931 131.336c-4.704 0-8.148-2.604-6.972-9.198l1.386-7.854h-3.528l.882-5.082h3.528l1.134-6.342h6.216l-1.134 6.342h4.83l-.882 5.082h-4.83l-1.512 8.568c-.336 1.932.63 3.108 2.352 3.108.924 0 1.47-.126 1.932-.294l-.924 5.376c-.462.126-1.302.294-2.478.294zM151.345 131.336c-4.704 0-8.148-2.604-6.972-9.198l1.386-7.854h-3.528l.882-5.082h3.528l1.134-6.342h6.216l-1.134 6.342h4.83l-.882 5.082h-4.83l-1.512 8.568c-.336 1.932.63 3.108 2.352 3.108.924 0 1.47-.126 1.932-.294l-.924 5.376c-.462.126-1.302.294-2.478.294zM130.802 131l3.864-21.798h6.258L137.06 131h-6.258zm4.284-24.528l1.05-6.006h6.552l-1.092 6.006h-6.51zM114.786 131.336c-4.956 0-8.736-4.158-8.736-9.996 0-6.762 4.368-12.474 11.55-12.474 2.604 0 5.124 1.008 6.342 2.478l1.89-10.962h6.258L126.798 131h-6.258l.462-2.436c-1.092 1.596-3.486 2.772-6.216 2.772zm2.016-5.25c3.864 0 6.006-3.738 6.006-7.14 0-2.982-1.89-4.83-4.662-4.83-3.486 0-5.88 3.024-5.88 6.972 0 2.898 1.89 4.998 4.536 4.998z"
                fill="#000"
              />
            </template>

            <template v-else>
              <path
                d="M86 225H66v-9h20v9z"
                fill="#FF9800"
              />
              <path
                d="M86 233H66v-8h20v8z"
                fill="#B05800"
              />
              <rect
                x="86"
                y="131"
                width="131"
                height="9"
                fill="#999999"
              />
              <path
                d="M95 57H206V131H95V57Z"
                fill="#0C23F4"
              />
              <path
                d="M171 91H128V93H171V91Z"
                fill="#BBBBBB"
              />
              <path
                d="M174 96H128V98H174V96Z"
                fill="#BBBBBB"
              />
              <path
                d="M144 101H128V103H144V101Z"
                fill="#BBBBBB"
              />
              <path
                d="M164 109H128V110H164V109Z"
                fill="#BBBBBB"
              />
              <path
                d="M128 76H130V78H128V76Z"
                fill="white"
              />
              <path
                d="M128 82H130V84H128V82Z"
                fill="white"
              />
              <path
                d="M135 83H137V85H135V83Z"
                fill="white"
              />
              <path
                d="M135 75H137V77H135V75Z"
                fill="white"
              />
              <path
                d="M133 77H135V83H133V77Z"
                fill="white"
              />
            </template>
          </IconComputer>
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
