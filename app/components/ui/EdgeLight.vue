<script lang="ts" setup>
// Wraps a group of `edge-light` cards and tells each one where the mouse is, relative to itself, so the light can spill
// across the gaps onto neighbouring cards. Updates at most once per frame and only writes values that changed.
// The cards are measured once and reused while the group stays put. Each frame measures only the group itself: if it
// has moved or changed size (a scroll, a resize, a screen sliding in), the cards are measured again.
let frame = 0
let pointer: { x: number; y: number; root: HTMLElement } | null = null
let cache: { root: DOMRect; cards: { el: HTMLElement; rect: DOMRect }[] } | null = null

const forget = () => (cache = null)

const isSameBox = (a: DOMRect, b: DOMRect) =>
  a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height

function measure(root: HTMLElement) {
  const box = root.getBoundingClientRect()
  if (cache && isSameBox(cache.root, box)) return cache.cards

  const cards = [...root.querySelectorAll<HTMLElement>('.edge-light')].map((el) => ({
    el,
    rect: el.getBoundingClientRect(),
  }))
  cache = { root: box, cards }
  return cards
}

function update() {
  frame = 0
  if (!pointer) return

  const { x, y, root } = pointer

  for (const { el, rect } of measure(root)) {
    const values = {
      '--el-x': `${Math.round(x - rect.left)}px`,
      '--el-y': `${Math.round(y - rect.top)}px`,
      '--el-w': `${Math.round(rect.width)}px`,
    }

    for (const [name, value] of Object.entries(values)) {
      if (el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value)
    }
  }
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
    @pointerleave="forget"
  >
    <slot />
  </div>
</template>
