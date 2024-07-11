<script lang="ts" setup>
import { colours } from '@/tailwind.config'

interface Props {
  thickness?: number
}

type Coord = 'x' | 'y'

const { thickness = 100 } = defineProps<Props>()
const svg = ref<SVGSVGElement | null>(null)
const path = ref<SVGPathElement | null>(null)
const segments = 500
const speed = 0.2
const points: Record<Coord, number>[] = []
const position: Record<Coord, number> = {
  x: 0,
  y: 0,
}

const lineHidden = ref(false)
const colourStops = [
  colours['blue-darker'],
  colours['purple-darker'],
  colours['orange-darker'],
  colours['pink-darker'],
]

let timer: NodeJS.Timeout

const move = (event: MouseEvent | TouchEvent) => {
  const rect = svg.value?.getBoundingClientRect()
  const offsetLeft = rect?.left ?? 0
  const offsetTop = rect?.top ?? 0

  let x = 0
  let y = 0

  if (event.type === 'mousemove') {
    const mouseEvent = event as MouseEvent

    x = mouseEvent.clientX - offsetLeft
    y = mouseEvent.clientY - offsetTop
  }
  else if (event.type === 'touchmove') {
    const touchEvent = event as TouchEvent
    const touch = touchEvent.touches[0]

    x = touch.clientX - offsetLeft
    y = touch.clientY - offsetTop
    touchEvent.preventDefault()
  }

  position.x = x
  position.y = y

  lineHidden.value = false
  clearTimeout(timer)
  timer = setTimeout(() => lineHidden.value = true, 1000)

  // If we already have the points array filled up, exit.
  if (points.length) {
    return
  }

  for (let i = 0; i < segments; i++) {
    points.push({
      x,
      y,
    })
  }
}

const animate = () => {
  let px = position.x
  let py = position.y

  points.forEach((point, index) => {
    point.x = px
    point.y = py

    const nextPoint: Record<Coord, number> | undefined = points[index + 1]

    if (nextPoint) {
      px = px - (point.x - nextPoint.x) * speed
      py = py - (point.y - nextPoint.y) * speed
    }
  })

  if (path.value && points.length) {
    path.value.setAttribute('d', `M ${points.map(point => `${point.x} ${point.y}`).join(' L ')}`)
  }

  requestAnimationFrame(animate)
}

const setSize = () => {
  if (!svg.value) {
    return
  }

  const parent = svg.value.parentElement
  const rect = parent?.getBoundingClientRect()
  const width = rect?.width ?? window.innerWidth
  const height = rect?.height ?? window.innerHeight

  svg.value.style.width = `${width}px`
  svg.value.style.height = `${height}px`
  svg.value.setAttribute('viewBox', `0 0 ${width} ${height}`)
}

onMounted(() => {
  if (!svg.value || !path.value) {
    return
  }

  setSize()
  animate()

  window.addEventListener('mousemove', move)
  window.addEventListener('touchmove', move)
  window.addEventListener('resize', setSize)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', move)
  window.removeEventListener('touchmove', move)
  window.removeEventListener('resize', setSize)
})
</script>

<template>
  <svg
    ref="svg"
    viewBox="0 0 1 1"
    class="h-full w-full transition-opacity duration-300"
    :class="lineHidden ? 'opacity-0' : ''"
  >
    <defs>
      <linearGradient id="tail-gradient">
        <stop
          v-for="(colour, index) in colourStops"
          :key="index"
          :offset="(index / (colourStops.length - 1)).toFixed(2)"
          :stop-color="colour"
        />
      </linearGradient>
    </defs>

    <path
      ref="path"
      d=""
      fill="none"
      class="transition-colors duration-300"
      stroke="url(#tail-gradient)"
      :stroke-width="thickness"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
