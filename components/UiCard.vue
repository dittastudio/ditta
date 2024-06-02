<script lang="ts" setup>
const project = ref<HTMLDivElement | null>(null)

const cardMouseOver = (event: any) => {
  const el = project.value

  if (!el)
    return

  const { top, left, width, height } = el.getBoundingClientRect()

  el.style.setProperty(
    '--x',
    String(event.clientX - (left + Math.floor(width / 2))),
  )
  el.style.setProperty(
    '--y',
    String(event.clientY - (top + Math.floor(height / 2))),
  )
}

const cardMouseOut = () => {
  const el = project.value

  if (!el)
    return

  el.style.setProperty('--x', '0')
  el.style.setProperty('--y', '0')
}
</script>

<template>
  <div
    ref="project"
    class="CardProject"
    @mousemove="cardMouseOver"
    @mouseout="cardMouseOut"
  >
    <div class="CardProject__media">
      <slot />
    </div>
  </div>
</template>

<style lang="postcss">
.CardProject {
  isolation: isolate;

  @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
    --x: 0;
    --y: 0;
    --t: 300;

    transform-style: preserve-3d;
    perspective: 800px;
  }
}

.CardProject__media {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);

  @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
    will-change: transform;

    transform-style: preserve-3d;
    transform: translate3d(0, 0, 0) rotateX(0) rotateY(0);

    outline: 1px solid transparent; /* FF smooths edges */

    transition: transform 0.3s var(--transition-timing-function-inOutBack);

    &::after {
      pointer-events: none;
      will-change: transform, opacity;
      content: '';

      position: absolute;
      z-index: 1;
      inset: 0;
      transform-style: preserve-3d;
      translate: 0 0 0;

      width: 50%;
      height: 0;
      margin: auto;
      padding-block-end: 50%;

      opacity: 0;
      background-color: var(--color-yellow-light);
      filter: blur(100px);
      border-radius: 50%;

      transition:
        opacity 0.25s var(--transition-timing-function-out),
        translate 0s 0.25s;

      .CardProject:hover & {
        translate: calc(var(--x) * -1px) calc(var(--y) * -1px) 0;
        opacity: 0.15;
        transition:
          opacity 0.25s var(--transition-timing-function-out),
          translate 0.25s var(--transition-timing-function-out);
      }
    }

    .CardProject:hover & {
      transform: translate3d(
          calc(var(--x) / var(--t) * 8px),
          calc(var(--y) / var(--t) * 8px),
          16px
        )
        rotateX(calc(var(--y) / var(--t) * -1deg))
        rotateY(calc(var(--x) / var(--t) * 1deg));
      transition: transform 0.1s var(--transition-timing-function-out);
    }
  }
}
</style>
