<script lang="ts" setup>
import IconMouse from '@/assets/icons/cursor.svg'

interface Position {
  x: number
  y: number
}

const cursorRef = ref<HTMLElement>()
const position = reactive<Position>({ x: 0, y: 0 })
const isVisible = ref(false)

let cleanupFunctions: (() => void)[] = []

const handleMouseMove = (e: MouseEvent) => {
  position.x = e.clientX
  position.y = e.clientY

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
      '--x': `${position.x}px`,
      '--y': `${position.y}px`,
    }"
  >
    <IconMouse class="cursor__dot text-pink absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

    <div class="cursor__crosshair absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30px] leading-[1] text-pink">
      +
    </div>
  </div>
</template>

<style lang="postcss">
.cursor {
  --cursor-size: 30px;

  translate: var(--x) var(--y) 0;
  transition:
    opacity 0.2s var(--ease-out),
    scale 0.2s var(--ease-out);
}

.cursor__dot {
  width: var(--cursor-size);
  height: var(--cursor-size);
}

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
