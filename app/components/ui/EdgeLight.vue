<script lang="ts" setup>
// Wraps a group of `edge-light` cards and tells each one where the mouse is, relative to itself, so the light can spill
// across the gaps onto neighbouring cards
function track(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return

  const cards = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.edge-light')]
  const rects = cards.map((card) => card.getBoundingClientRect())

  cards.forEach((card, i) => {
    const rect = rects[i]!
    card.style.setProperty('--el-x', `${event.clientX - rect.left}px`)
    card.style.setProperty('--el-y', `${event.clientY - rect.top}px`)
    card.style.setProperty('--el-w', `${rect.width}px`)
  })
}
</script>

<template>
  <div
    data-edge-light
    @pointermove="track"
  >
    <slot />
  </div>
</template>
