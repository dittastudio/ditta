<script lang="ts" setup>
import type { BentoGameStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoGameStoryblok
}

interface Velocity {
  x: number
  y: number
}

const { block } = defineProps<Props>()

const container = ref<HTMLDivElement | null>(null)
const itemRefs = ref<HTMLDivElement[]>([])
const circles: any = []

let w = 0
let h = 0

const rotate = (velocity: Velocity, angle: number) => {
  const rotatedVelocities = {
    x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
    y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle),
  }

  return rotatedVelocities
}

const resolveCollision = (particle: any, otherParticle: any) => {
  const xVelocityDiff = particle.velocity.x - otherParticle.velocity.x
  const yVelocityDiff = particle.velocity.y - otherParticle.velocity.y

  const xDist = otherParticle.x - particle.x
  const yDist = otherParticle.y - particle.y

  // Prevent accidental overlap of particles
  if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
    // Grab angle between the two colliding particles
    const angle = -Math.atan2(otherParticle.y - particle.y, otherParticle.x - particle.x)

    // Store mass in var for better readability in collision equation
    const m1 = particle.mass
    const m2 = otherParticle.mass

    // Velocity before equation
    const u1 = rotate(particle.velocity, angle)
    const u2 = rotate(otherParticle.velocity, angle)

    // Velocity after 1d collision equation
    const v1 = { x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), y: u1.y }
    const v2 = { x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m2 / (m1 + m2), y: u2.y }

    // Final velocity after rotating axis back to original location
    const vFinal1 = rotate(v1, -angle)
    const vFinal2 = rotate(v2, -angle)

    // Swap particle velocities for realistic bounce effect
    particle.velocity.x = vFinal1.x
    particle.velocity.y = vFinal1.y

    otherParticle.velocity.x = vFinal2.x
    otherParticle.velocity.y = vFinal2.y
  }
}

const setCanvasSize = () => {
  if (!container.value) {
    return
  }

  const { width, height } = container.value.getBoundingClientRect()
  w = width
  h = height
}

const objectCollision = (aX: number, aY: number, aR: number, bX: number, bY: number, bR: number) => {
  const dx = aX - bX
  const dy = aY - bY
  const distance = Math.sqrt(dx * dx + dy * dy)

  return (distance < aR + bR)
}

const getPosition = (radius: number): Velocity => {
  const x = Math.random() * (w - radius * 2)
  const y = Math.random() * (h - radius * 2)

  for (const circle of circles) {
    if (objectCollision(x, y, radius, circle.x, circle.y, circle.radius)) {
      console.log('there was a collion, try again')
      return getPosition(radius)
    }
  }

  return { x, y }
}

class Circle {
  el: HTMLDivElement
  x: number
  y: number
  velocity: Velocity
  radius: number
  mass: number
  interactive: boolean
  deactivated: boolean

  constructor(el: HTMLDivElement, x: number, y: number, velocity: Velocity, radius: number, mass: number, interactive: boolean, deactivated: boolean) {
    this.el = el
    this.x = x
    this.y = y
    this.velocity = velocity
    this.radius = radius
    this.mass = mass
    this.interactive = interactive
    this.deactivated = deactivated
  }

  draw() {
    if (this.interactive) {
      this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`
    }
    else {
      const activeItems = circles.filter((circle: Circle) => !circle.deactivated)
      const scaleFactor = Math.floor(Math.max(w, h) * 2 / (this.radius * 2))

      this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) scale(${scaleFactor})`
      this.el.style.zIndex = `-${activeItems.length}`
      this.deactivated = true
    }
  }

  update() {
    if (this.x + (this.radius * 2) > w || this.x < 0) {
      this.velocity.x = -this.velocity.x
    }

    if (this.y + (this.radius * 2) > h || this.y < 0) {
      this.velocity.y = -this.velocity.y
    }

    circles.forEach((circle: Circle) => {
      if (this !== circle && this.interactive && circle.interactive) {
        if (objectCollision(this.x, this.y, this.radius, circle.x, circle.y, circle.radius)) {
          // this.velocity.x = -this.velocity.x
          // this.velocity.y = -this.velocity.y
          resolveCollision(this, circle)
        }
      }
    })

    if (this.interactive) {
      this.x += this.velocity.x
      this.y += this.velocity.y
    }

    if (!this.deactivated) {
      this.draw()
    }
  }
}

const draw = () => {
  circles.forEach((circle: Circle) => circle.update())
  window.requestAnimationFrame(draw)
}

const list = [
  'bg-blue',
  'bg-green',
  'bg-purple',
  'bg-orange',
  'bg-pink',
]

onMounted(() => {
  if (!container.value) {
    return
  }

  const { width, height } = container.value.getBoundingClientRect()
  w = width
  h = height
  const items = itemRefs.value

  setCanvasSize()
  window.addEventListener('resize', setCanvasSize)

  items.forEach((item, _index) => {
    const { width: itemWidth } = item.getBoundingClientRect()
    const radius = itemWidth / 2
    const speed = 2
    const velocity = {
      x: (Math.random() - 0.5) * speed,
      y: (Math.random() - 0.5) * speed,
    }
    const { x, y } = getPosition(radius)
    const mass = 1
    const circle = new Circle(item, x, y, velocity, radius, mass, true, false)

    // item.addEventListener('click', () => {
    //   item.classList.add('is-grown')
    //   circles[index].interactive = false
    // })

    circles.push(circle)

    item.classList.remove('opacity-0')
  })

  draw()
})
</script>

<template>
  <ul
    ref="container"
    v-editable="block"
    class="w-full h-full bg-offblack"
  >
    <li
      v-for="(item, index) in list"
      ref="itemRefs"
      :key="item"
      class="absolute size-24 rounded-full opacity-0"
      :class="item"
    >
      <span class="sr-only">
        Ball {{ index + 1 }}
      </span>
    </li>
  </ul>
</template>
