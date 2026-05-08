<script lang="ts" setup>
import type p5 from 'p5'
import { gsap } from 'gsap'

interface Props {
  blocks?: number
  duration?: number
}

const { blocks = 30, duration = 1 } = defineProps<Props>()
const root = useTemplateRef('root')

let sketch: p5 | undefined
let io: IntersectionObserver | undefined
let ro: ResizeObserver | undefined

onMounted(async () => {
  const img = root.value?.querySelector('img')

  if (!img) return

  const { default: P5 } = await import('p5')

  const source = new Image()
  source.crossOrigin = 'anonymous'
  source.src = img.src

  const offscreen = document.createElement('canvas')
  const offCtx = offscreen.getContext('2d')!
  const state = { blocks }

  const createSketch = () => {
    if (!root.value) return

    sketch?.remove()

    const { width, height } = root.value.getBoundingClientRect()

    sketch = new P5((p: p5) => {
      p.setup = () => {
        const cnv = p.createCanvas(width, height)

        cnv.style('position', 'absolute')
        cnv.style('top', '0')
        cnv.style('left', '0')
        cnv.style('width', '100%')
        cnv.style('height', '100%')
        cnv.style('pointer-events', 'none')

        p.noLoop()

        img.style.opacity = '0'

        p.redraw()
      }

      p.draw = () => {
        const bs = Math.max(1, Math.round(state.blocks))
        const sw = Math.ceil(p.width / bs)
        const sh = Math.ceil(p.height / bs)

        offscreen.width = sw
        offscreen.height = sh
        offCtx.drawImage(source, 0, 0, sw, sh)

        const ctx = p.drawingContext as CanvasRenderingContext2D
        ctx.imageSmoothingEnabled = false
        ctx.clearRect(0, 0, p.width, p.height)
        ctx.drawImage(offscreen, 0, 0, sw, sh, 0, 0, p.width, p.height)
      }
    }, root.value)

    ro = new ResizeObserver(() => {
      if (!root.value) return
      const { width, height } = root.value.getBoundingClientRect()
      sketch?.resizeCanvas(width, height)
      sketch?.redraw()
    })

    ro.observe(root.value)

    io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return

        gsap.to(state, {
          blocks: 1,
          duration,
          ease: 'power1.out',
          onUpdate: () => sketch?.redraw(),
          onComplete: () => {
            img.style.opacity = ''
            sketch?.remove()
            sketch = undefined
          },
        })

        io?.disconnect()
      },
      { rootMargin: '0px 0px -50% 0px', threshold: 0 },
    )

    io.observe(img)
  }

  if (source.complete && source.naturalWidth > 0) {
    createSketch()
  } else {
    source.addEventListener('load', createSketch, { once: true })
  }
})

onUnmounted(() => {
  sketch?.remove()
  io?.disconnect()
  ro?.disconnect()
})
</script>

<template>
  <div
    ref="root"
    class="relative"
  >
    <slot />
  </div>
</template>
