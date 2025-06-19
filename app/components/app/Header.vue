<script setup lang="ts">
let rafId: number | null = null
let totalRotation = 0
let lastAngle = 0

const normalizeAngle = (angle: number): number => {
  // Normalize angle to -180 to 180 range
  while (angle > 180) angle -= 360
  while (angle < -180) angle += 360
  return angle
}

const handleGlobalMouseMove = (event: MouseEvent) => {
  // Throttle the mouse movement for better performance
  if (rafId)
    return

  rafId = requestAnimationFrame(() => {
    // Get the header link element
    const headerLink = document.querySelector('.app-header__link') as HTMLElement
    if (!headerLink)
      return

    const rect = headerLink.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2

    // Calculate distance from center
    const distance = Math.sqrt(x * x + y * y)

    // Only apply rotation if mouse is within a reasonable distance
    if (distance < 400) {
      // Calculate target angle using atan2 for full 360° range
      const newTargetAngle = Math.atan2(y, x) * (180 / Math.PI)

      // Handle angle wrapping for continuous rotation
      const angleDiff = newTargetAngle - lastAngle
      const normalizedDiff = normalizeAngle(angleDiff)

      // Add to total rotation
      totalRotation += normalizedDiff
      lastAngle = newTargetAngle

      // Calculate opacity based on distance (closer = more opaque)
      const maxDistance = 400
      const opacity = Math.max(0, 1 - (distance / maxDistance))

      // Set CSS custom properties
      headerLink.style.setProperty('--mouse-x', x.toString())
      headerLink.style.setProperty('--mouse-y', y.toString())
      headerLink.style.setProperty('--mouse-angle', `${totalRotation}deg`)
      headerLink.style.setProperty('--mouse-opacity', opacity.toString())
    }
    else {
      // Reset opacity when mouse is too far
      headerLink.style.setProperty('--mouse-opacity', '0')
    }

    rafId = null
  })
}

// Add global mouse tracking when component mounts
onMounted(() => {
  document.addEventListener('mousemove', handleGlobalMouseMove, { passive: true })
})

// Clean up when component unmounts
onUnmounted(() => {
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
})
</script>

<template>
  <header class="sticky top-0 h-0 z-10 wrapper">
    <div class="flex justify-end items-end py-[var(--app-outer-gutter)]">
      <a
        class="app-header__link group relative block p-[20px] -m-[20px]"
        href="mailto:hello@ditta.studio"
      >
        <div class="app-header__disc absolute inset-0 -z-1 rounded-full group-hover:scale-105 group-hover:opacity-100 transition-all duration-300 ease-inOut" />

        <img
          class="app-header__image block size-[40px]"
          src="/imgs/mano.png"
          alt="Mano"
        >
      </a>
    </div>
  </header>
</template>

<style lang="postcss">
.app-header__disc {
  /* background-color: color-mix(in srgb, var(--color-white) 30%, transparent); */
  /* border-top: 1px solid color-mix(in srgb, var(--color-white) 60%, transparent); */
  /* border-left: 1px solid color-mix(in srgb, var(--color-white) 60%, transparent); */
  /*  */
  /* box-shadow: inset 5px 5px 10px color-mix(in srgb, var(--color-white) 30%, transparent); */

  backdrop-filter: blur(4px);
  /* box-shadow: inset -5px -5px 10px rgba(0, 0, 0, 0.1), inset 5px 5px 10px color-mix(in srgb, var(--color-white) 30%, transparent); */

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid color-mix(in srgb, var(--color-white) 40%, transparent);
    border-radius: inherit;
    z-index: 1;
    opacity: var(--mouse-opacity, 0);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: var(--mouse-opacity, 0);
    box-shadow: inset -5px -5px 10px color-mix(in srgb, var(--color-white) 40%, transparent);
    border-radius: inherit;
    z-index: 1;
    transform: rotate(calc(var(--mouse-angle, 0deg) - 45deg));
    will-change: transform;
  }
}
.app-header__image {
  transform-origin: bottom left;
  display: block;

  @keyframes hover-hand {
    0% {
      translate: 0 0 0;
      rotate: 0deg;
    }

    15% {
      translate: -4px 0 0;
      rotate: -10deg;
    }

    30% {
      translate: 4px 0 0;
      rotate: 10deg;
    }

    45% {
      translate: 0 0 0;
      rotate: -8deg;
    }

    60% {
      rotate: 6deg;
    }

    75% {
      rotate: -4deg;
    }

    90% {
      rotate: 0deg;
    }

    100% {
      rotate: 0deg;
    }
  }

  .app-header__link:hover & {
    animation: hover-hand 0.75s var(--ease-out) forwards;
  }
}
</style>
