<script lang="ts" setup>
// Wraps a group of `edge-light` cards and tells each one where the mouse is, relative to itself, so the light can spill
// across the gaps onto neighbouring cards. Updates at most once per frame: all reads, then all writes, and only values
// that changed, so the browser never has to lay out mid-frame.
let frame = 0
let pointer: { x: number; y: number; root: HTMLElement } | null = null

function update() {
  frame = 0
  if (!pointer) return

  const { x, y, root } = pointer
  const cards = [...root.querySelectorAll<HTMLElement>('.edge-light')]
  const rects = cards.map((card) => card.getBoundingClientRect())

  cards.forEach((card, i) => {
    const rect = rects[i]!
    const values = {
      '--el-x': `${Math.round(x - rect.left)}px`,
      '--el-y': `${Math.round(y - rect.top)}px`,
      '--el-w': `${Math.round(rect.width)}px`,
    }

    for (const [name, value] of Object.entries(values)) {
      if (card.style.getPropertyValue(name) !== value) card.style.setProperty(name, value)
    }
  })
}

function track(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return

  pointer = { x: event.clientX, y: event.clientY, root: event.currentTarget as HTMLElement }
  if (!frame) frame = requestAnimationFrame(update)
}

onUnmounted(() => cancelAnimationFrame(frame))
</script>

<template>
  <div
    data-edge-light
    @pointermove="track"
  >
    <slot />
  </div>
</template>
