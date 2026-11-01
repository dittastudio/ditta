<script lang="ts" setup>
import { COIN_DURATION, COIN_FRAMES, COIN_STEPS } from '@/utils/mario/coin'
import { SIZE } from '@/utils/mario/physics'

import IconMarioCoin from '@/assets/icons/mario-coin.svg'

interface Props {
  x: number // screen px from the stage's top left, to the coin's
  y: number
}

const { x, y } = defineProps<Props>()

const emit = defineEmits<{
  done: []
}>()

const coinEl = useTemplateRef('coin')
const sheetEl = useTemplateRef('sheet')

// Each step held for an equal share, the last repeated to close the final one
const flipbook = (translate: (step: (typeof COIN_STEPS)[number]) => string) =>
  [...COIN_STEPS, ...COIN_STEPS.slice(-1)].map((step) => ({ easing: 'steps(1, end)', translate: translate(step) }))

const timing = { duration: COIN_DURATION, fill: 'forwards' } as const

// Percentages of the coin's own box, so the sprite pixels hold at any scale
onMounted(() => {
  const coin = coinEl.value?.animate(
    flipbook((step) => `0 ${(step.y / SIZE) * 100}%`),
    timing,
  )

  // The NES spins every coin off its global frame counter, so each one starts wherever that happens to be
  const spin = Math.floor(Math.random() * COIN_FRAMES)

  sheetEl.value?.animate(
    flipbook((step) => `${(-((step.frame + spin) % COIN_FRAMES) / COIN_FRAMES) * 100}% 0`),
    timing,
  )

  if (coin) coin.onfinish = () => emit('done')
  else emit('done')
})
</script>

<template>
  <div
    ref="coin"
    class="absolute w-5 md:w-6 h-10 md:h-12 overflow-hidden pointer-events-none select-none"
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <div
      ref="sheet"
      class="h-full w-max"
    >
      <IconMarioCoin
        class="h-full w-auto"
        shape-rendering="crispEdges"
      />
    </div>
  </div>
</template>
