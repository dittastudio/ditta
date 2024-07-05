<script lang="ts" setup>
import type { BentoGameStoryblok } from '@/types/storyblok'
import { colours } from '@/tailwind.config'

interface Props {
  block: BentoGameStoryblok
}

const { block } = defineProps<Props>()
const container = ref<HTMLDivElement | null>(null)
const audio = ref<HTMLAudioElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

class Circle {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  radius: number
  color: string
  dx: number
  dy: number

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, dx: number, dy: number) {
    this.canvas = canvas
    this.ctx = ctx
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.dx = dx
    this.dy = dy
  }

  draw() {
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    this.ctx.fillStyle = this.color
    this.ctx.fill()
    this.ctx.closePath()
  }

  update(circles: Circle[]) {
    this.x += this.dx
    this.y += this.dy

    // Bounce off the walls
    if (this.x - this.radius < 0 || this.x + this.radius > canvas.value.width) {
      this.dx = -this.dx
    }

    if (this.y - this.radius < 0 || this.y + this.radius > canvas.value.height) {
      this.dy = -this.dy
    }

    // Collision detection
    for (const circle of circles) {
      if (this !== circle && this.isCollidingWith(circle)) {
        this.resolveCollision(circle)
      }
    }

    this.draw()
  }

  isCollidingWith(circle: Circle): boolean {
    const dist = Math.hypot(this.x - circle.x, this.y - circle.y)
    return dist - this.radius - circle.radius < 0
  }

  resolveCollision(circle: Circle) {
    const xVelocityDiff = this.dx - circle.dx
    const yVelocityDiff = this.dy - circle.dy
    const xDist = circle.x - this.x
    const yDist = circle.y - this.y

    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
      const angle = -Math.atan2(circle.y - this.y, circle.x - this.x)
      const m1 = this.radius
      const m2 = circle.radius
      const u1 = this.rotate(this.dx, this.dy, angle)
      const u2 = this.rotate(circle.dx, circle.dy, angle)
      const v1 = { x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), y: u1.y }
      const v2 = { x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m1 / (m1 + m2), y: u2.y }
      const vFinal1 = this.rotate(v1.x, v1.y, -angle)
      const vFinal2 = this.rotate(v2.x, v2.y, -angle)
      this.dx = vFinal1.x
      this.dy = vFinal1.y
      circle.dx = vFinal2.x
      circle.dy = vFinal2.y
    }
  }

  rotate(dx: number, dy: number, angle: number) {
    return {
      x: dx * Math.cos(angle) - dy * Math.sin(angle),
      y: dx * Math.sin(angle) + dy * Math.cos(angle),
    }
  }
}

const { blue, pink, orange, green, purple } = colours
const colors = [blue, pink, orange, green, purple]
const circles: Circle[] = []

const onClick = (event: any) => {
  if (!canvas.value || !ctx.value) {
    return
  }

  const rect = canvas.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  for (let i = 0; i < circles.length; i++) {
    const circle = circles[i]

    if (Math.hypot(circle.x - mouseX, circle.y - mouseY) < circle.radius) {
      const newRadius = circle.radius / 2

      // Can we split?
      if (newRadius > 2) {
        if (audio.value) {
          audio.value.currentTime = 0
          audio.value.play()
        }

        const angle = Math.random() * Math.PI * 2
        const dx1 = circle.dx * Math.cos(angle)
        const dy1 = circle.dy * Math.sin(angle)
        const dx2 = -circle.dx * Math.cos(angle)
        const dy2 = -circle.dy * Math.sin(angle)

        circles.push(new Circle(canvas.value, ctx.value, circle.x, circle.y, newRadius, circle.color, dx1, dy1))
        circles.push(new Circle(canvas.value, ctx.value, circle.x, circle.y, newRadius, circle.color, dx2, dy2))
        circles.splice(i, 1)
      }

      break
    }
  }
}

const animate = () => {
  if (!canvas.value || !ctx.value) {
    return
  }

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)

  for (const circle of circles) {
    circle.update(circles)
  }

  requestAnimationFrame(animate)
}

const setCanvasSize = () => {
  if (!container.value || !canvas.value) {
    return
  }

  const { width, height } = container.value.getBoundingClientRect()

  canvas.value.width = width
  canvas.value.height = height
}

onMounted(() => {
  if (!container.value || !canvas.value) {
    return
  }

  ctx.value = canvas.value.getContext('2d')

  if (!ctx.value) {
    return
  }

  setCanvasSize()

  for (let i = 0; i < 5; i++) {
    const radius = 20
    const x = Math.random() * (canvas.value.width - radius * 2) + radius
    const y = Math.random() * (canvas.value.height - radius * 2) + radius
    const dx = (Math.random() - 0.5) * 2
    const dy = (Math.random() - 0.5) * 2
    const color = colors[i] ?? colors[0]

    circles.push(new Circle(canvas.value, ctx.value, x, y, radius, color, dx, dy))
  }

  canvas.value.addEventListener('click', onClick)
  window.addEventListener('resize', setCanvasSize)

  animate()
})

onUnmounted(() => {
  canvas.value?.removeEventListener('click', onClick)
  window.removeEventListener('resize', setCanvasSize)
})
</script>

<template>
  <div
    ref="container"
    v-editable="block"
    class="w-full h-full bg-offblack"
  >
    <audio
      ref="audio"
      src="/audio/pop.mp3"
    />

    <canvas
      ref="canvas"
      class="block w-full h-full"
    />
  </div>
</template>
