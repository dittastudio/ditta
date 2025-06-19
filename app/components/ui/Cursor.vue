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
let cleanupFunctions: (() => void)[] = []

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

  // Clean up hover element listeners
  cleanupFunctions.forEach(cleanup => cleanup())
  cleanupFunctions = []

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
    class="cursor fixed top-0 left-0 z-50 pointer-events-none touch:hidden opacity-0 will-change-translate mix-blend-difference"
    :style="{
      '--x': `${currentPosition.x}px`,
      '--y': `${currentPosition.y}px`,
    }"
  >
    <div class="cursor__dot absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-pink rounded-full" />

    <div class="cursor__crosshair absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30px] leading-[1] text-pink">
      +
    </div>
  </div>
</template>

<style lang="postcss">
.cursor {
  --cursor-size: 24px;

  translate: var(--x) var(--y) 0;
  transition:
    opacity 0.2s var(--ease-out),
    scale 0.2s var(--ease-out);
}

.cursor__dot {
  width: var(--cursor-size);
  height: var(--cursor-size);
}

/* body {
  background-color: transparent;
  transition: background-color 0.3s var(--ease-out);
}

body.has-hover-color {
  background-color: var(--dynamic-hover-color);
} */

html.is-doom-active .cursor__dot {
  opacity: 0;
}

html .cursor__crosshair {
  opacity: 0;
}

html.is-doom-active .cursor__crosshair {
  opacity: 1;
}

body:has(a:hover, button:hover) .cursor {
  scale: 2;
}

a {
  cursor: none;
}
</style>
