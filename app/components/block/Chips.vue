<script lang="ts" setup>
import { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint } from 'matter-js'
import type { BlockChips } from '#storyblok-components'

interface Props {
  block: BlockChips
}

const { block } = defineProps<Props>()

const containerRef = useTemplateRef<HTMLElement>('container')
const chipRefs = useTemplateRef<HTMLElement[]>('chipRef')
const transforms = ref<string[]>([])
const ready = ref(false)

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

onMounted(() => {
  const el = containerRef.value
  const chipEls = chipRefs.value

  if (!el || !chipEls?.length) return

  const { width, height } = el.getBoundingClientRect()

  const sizes = chipEls.map((chip) => {
    const { width: w, height: h } = chip.getBoundingClientRect()
    return { w, h }
  })

  if (sizes.some(({ w, h }) => w === 0 || h === 0)) return

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
    const body = Bodies.rectangle(x, y, w, h, {
      chamfer: { radius: h / 2 },
      restitution: 0.5,
      friction: 0.05,
      frictionAir: 0.02,
      angle: (Math.random() - 0.5) * Math.PI * 0.4,
    })
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8,
    })
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

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const { width: newW, height: newH } = entry.contentRect

    walls.forEach((wall) => Composite.remove(engine.world, wall))
    walls = buildWalls(newW, newH)
    Composite.add(engine.world, walls)

    bodies.forEach((body, i) => {
      const size = sizes[i]
      if (!size) return
      Body.setPosition(body, {
        x: Math.max(size.w / 2, Math.min(newW - size.w / 2, body.position.x)),
        y: Math.max(size.h / 2, Math.min(newH - size.h / 2, body.position.y)),
      })
    })
  })

  observer.observe(el)

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
    observer.disconnect()
  }
})

onUnmounted(() => stopPhysics?.())
</script>

<template>
  <div class="wrapper relative">
    <div class="relative z-1">
      <UiLockup
        :heading="block.heading"
        :copy="block.copy"
      />
    </div>

    <div class="w-full h-80">
      <!-- Filler element to create space. -->
    </div>

    <div
      ref="container"
      class="absolute inset-0 z-0 select-none"
    >
      <div
        v-for="(chip, i) in block.chips"
        :key="chip._uid"
        ref="chipRef"
        class="absolute top-0 left-0 pointer-events-none will-change-transform transition-opacity duration-500"
        :class="ready ? 'opacity-100' : 'opacity-0'"
        :style="transforms[i] ? { transform: transforms[i] } : {}"
      >
        <UiChip
          :text="chip.title"
          size="large"
          theme="light"
        />
      </div>
    </div>
  </div>
</template>
