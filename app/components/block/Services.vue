<script lang="ts" setup>
import { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint } from 'matter-js'
import type { BlockServices } from '#storyblok-components'
import IconPixelComputer from '@/assets/icons/pixel-computer.svg'

interface Props {
  block: BlockServices
}

const { block } = defineProps<Props>()

const containerRef = useTemplateRef('container')
const chipRefs = useTemplateRef('chipRef')
const transforms = shallowRef<string[]>([])
const ready = ref(false)

const services = await useDatasource('services', block.services)

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

    Composite.add(
      engine.world,
      MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.15, damping: 0.1 },
      }),
    )

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
  stopPhysics?.()
})
</script>

<template>
  <div
    v-editable="block"
    class="wrapper relative overflow-hidden"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div class="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-5 relative z-1 pb-80 pointer-events-none">
      <UiLockup
        class="col-span-full md:col-span-8 *:pointer-events-auto"
        :heading="block.heading"
        :copy="block.copy"
      />

      <div class="col-span-full md:col-span-4">
        <IconPixelComputer
          class="animate-bob w-50 md:w-60 mx-auto md:ml-auto text-accent"
          :style="{ transform: `rotate(${rotation}deg)` }"
        />
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
        class="absolute top-0 left-0 pointer-events-none will-change-transform transition-opacity duration-500"
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
