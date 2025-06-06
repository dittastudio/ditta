<script lang="ts" setup>
interface Position {
  x: number
  y: number
}

const cursorRef = ref<HTMLElement>()
const currentPosition = reactive<Position>({ x: 0, y: 0 })
const targetPosition = reactive<Position>({ x: 0, y: 0 })
const isVisible = ref(false)

let rafId: number | null = null
let isAnimating = false

const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor
}

// Animation loop with lerp
const animateCursor = () => {
  const lerpFactor = 0.4 // Adjust this value for different smoothness (0.1 = slower, 0.3 = faster)

  // Interpolate between current and target positions
  currentPosition.x = lerp(currentPosition.x, targetPosition.x, lerpFactor)
  currentPosition.y = lerp(currentPosition.y, targetPosition.y, lerpFactor)

  // Check if we're close enough to the target to stop animating
  const distance = Math.sqrt(
    (targetPosition.x - currentPosition.x) ** 2
    + (targetPosition.y - currentPosition.y) ** 2,
  )

  // Continue animation if we're not close enough to target
  if (distance > 0.5) {
    rafId = requestAnimationFrame(animateCursor)
  }
  else {
    isAnimating = false
    rafId = null
  }
}

const startAnimation = () => {
  if (!isAnimating) {
    isAnimating = true
    animateCursor()
  }
}

const handleMouseMove = (e: MouseEvent) => {
  targetPosition.x = e.clientX
  targetPosition.y = e.clientY

  startAnimation()

  if (!isVisible.value) {
    isVisible.value = true
  }
}

const handleMouseEnter = () => {
  isVisible.value = true
}

const handleMouseLeave = () => {
  isVisible.value = false
}

onMounted(() => {
  document.body.style.cursor = 'none'

  document.addEventListener('mousemove', handleMouseMove, { passive: true })
  document.addEventListener('mouseenter', handleMouseEnter)
  document.addEventListener('mouseleave', handleMouseLeave)
})

onUnmounted(() => {
  document.body.style.cursor = 'auto'

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseenter', handleMouseEnter)
  document.removeEventListener('mouseleave', handleMouseLeave)

  if (rafId) {
    cancelAnimationFrame(rafId)
    isAnimating = false
  }
})

watchEffect(() => {
  if (cursorRef.value) {
    cursorRef.value.style.opacity = isVisible.value ? '1' : '0'
  }
})
</script>

<template>
  <div
    ref="cursorRef"
    class="cursor"
    :style="{
      '--x': `${currentPosition.x}px`,
      '--y': `${currentPosition.y}px`,
    }"
  />
</template>

<style lang="postcss">
.cursor {
  --cursor-size: 24px;

  position: fixed;
  top: 0;
  left: 0;
  width: var(--cursor-size);
  height: var(--cursor-size);
  background-color: var(--color-pink);
  border-radius: 50%;
  pointer-events: none;
  z-index: 50;
  opacity: 0;
  will-change: translate;
  translate: calc(var(--x) - (var(--cursor-size) / 2)) calc(var(--y) - (var(--cursor-size) / 2)) 0;
  mix-blend-mode: difference;
  transition:
    opacity 0.2s var(--ease-out),
    scale 0.2s var(--ease-out);
}

body {
  background-color: transparent;
  transition: background-color 0.5s var(--ease-inOut);
}

body:has(a:hover, button:hover) {
  background-color: var(--color-pink);
}

body:has(p a:hover) .cursor {
  scale: 2;
}
</style>
