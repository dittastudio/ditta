<script lang="ts" setup>
import { gsap } from 'gsap'

interface Props {
  blocks?: number
  duration?: number
}

const { blocks = 30, duration = 1 } = defineProps<Props>()
const root = useTemplateRef('root')

function coverCrop(
  source: HTMLImageElement,
  img: HTMLImageElement,
  containerW: number,
  containerH: number,
): [number, number, number, number] {
  const { naturalWidth: nw, naturalHeight: nh } = source
  const objectFit = getComputedStyle(img).objectFit

  if (objectFit !== 'cover') return [0, 0, nw, nh]

  const scale = Math.max(containerW / nw, containerH / nh)
  const scaledW = nw * scale
  const scaledH = nh * scale

  const [rawX = '50%', rawY = '50%'] = getComputedStyle(img).objectPosition.split(' ')
  const parseAxis = (v: string) =>
    v === 'left' || v === 'top' ? 0 : v === 'right' || v === 'bottom' ? 1 : v === 'center' ? 0.5 : parseFloat(v) / 100

  const sx = ((scaledW - containerW) * parseAxis(rawX)) / scale
  const sy = ((scaledH - containerH) * parseAxis(rawY)) / scale

  return [sx, sy, containerW / scale, containerH / scale]
}

let canvas: HTMLCanvasElement | undefined
let ro: ResizeObserver | undefined

onMounted(() => {
  const img = root.value?.querySelector('img')

  if (!img) return

  const source = new Image()
  source.crossOrigin = 'anonymous'
  source.src = img.src

  const offscreen = document.createElement('canvas')
  const offCtx = offscreen.getContext('2d')!
  const state = { blocks }

  function draw() {
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')!
    const bs = Math.max(1, Math.round(state.blocks))
    const sw = Math.ceil(canvas.width / bs)
    const sh = Math.ceil(canvas.height / bs)
    const [sx, sy, srcW, srcH] = coverCrop(source, img, canvas.width, canvas.height)

    offscreen.width = sw
    offscreen.height = sh
    offCtx.drawImage(source, sx, sy, srcW, srcH, 0, 0, sw, sh)

    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(offscreen, 0, 0, sw, sh, 0, 0, canvas.width, canvas.height)
  }

  function initCanvas() {
    if (!root.value || !img) return

    canvas?.remove()

    const { width, height } = root.value.getBoundingClientRect()

    canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    Object.assign(canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    })

    root.value.appendChild(canvas)
    img.style.opacity = '0'

    draw()

    ro = new ResizeObserver(() => {
      if (!root.value || !canvas) return
      const { width, height } = root.value.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
      draw()
    })

    ro.observe(root.value)

    gsap.to(state, {
      blocks: 1,
      duration,
      ease: 'power1.out',
      scrollTrigger: {
        trigger: root.value,
        start: 'top center',
        end: 'center center',
        scrub: true,
      },
      onUpdate: draw,
    })
  }

  if (source.complete && source.naturalWidth > 0) {
    initCanvas()
  } else {
    source.addEventListener('load', initCanvas, { once: true })
  }
})

onUnmounted(() => {
  canvas?.remove()
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
