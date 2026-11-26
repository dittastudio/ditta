<script setup lang="ts">
import type { Themes } from '@/types/app'
import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'
import { defineSound, type SoundDefinition } from '@web-kits/audio'
import { swoosh } from '@@/.web-kits/playful'

interface Props {
  theme?: Themes
  text?: string
  size?: 'large' | 'medium'
  icon?: boolean
  /** Which way the arrow points. Pointing left, it comes before the text */
  arrow?: 'up-right' | 'right' | 'left'
  /** Played on hover. A swoosh unless given */
  sound?: SoundDefinition
}

const { theme = 'light', text, size = 'large', icon = true, arrow = 'up-right', sound = swoosh } = defineProps<Props>()

const leading = computed(() => icon && arrow === 'left')

// The side with the icon sits tighter, so the icon's circle has even space round it
const padding = computed(() => {
  if (size === 'large') {
    if (!icon) return 'px-5 md:px-6'
    return leading.value ? 'pl-2.5 md:pl-3.75 pr-5 md:pr-6' : 'pl-5 md:pl-6 pr-2.5 md:pr-3.75'
  }

  if (!icon) return 'px-4'
  return leading.value ? 'pl-2 pr-4' : 'pl-4 pr-2'
})

// The arrow's rotation, and the direction it fires in on hover (x and y, each -1, 0 or 1)
const arrows = {
  'up-right': { class: 'rotate-45', x: 1, y: -1 },
  right: { class: 'rotate-90', x: 1, y: 0 },
  left: { class: '-rotate-90', x: -1, y: 0 },
} as const

const hoverSound = computed(() => defineSound(sound))
const { playHover } = useAudio()

const root = useTemplateRef('root')
const width = ref(0)
const height = ref(0)

const scaleX = computed(() => (width.value ? Math.round(((width.value + 6) / width.value) * 100) / 100 : 1))
const scaleY = computed(() => (height.value ? Math.round(((height.value + 6) / height.value) * 100) / 100 : 1))

let observer: ResizeObserver | null = null

onMounted(() => {
  if (!root.value) return

  observer = new ResizeObserver(([entry]) => {
    const box = entry?.borderBoxSize[0]
    if (!box) return
    width.value = box.inlineSize
    height.value = box.blockSize
  })

  observer.observe(root.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <span
    ref="root"
    :style="{ '--scale-x': scaleX, '--scale-y': scaleY }"
    class="ui-button relative isolate select-none inline-flex items-center font-medium leading-none rounded-full"
    @pointerenter="playHover($event, hoverSound)"
    :class="[
      `ui-button--${size}`,
      { 'gap-[0.71em]': icon },
      size === 'large' ? 'py-2.5 md:py-3.75' : 'py-2',
      padding,
      theme ? themeTextClasses[theme as Themes] : '',
    ]"
  >
    <span
      class="ui-button__bg absolute inset-0 -z-1 rounded-[inherit]"
      :class="[theme ? themeBgClasses[theme as Themes] : '']"
    />

    <span
      v-if="text"
      class="mt-[-0.15em] mb-[-0.1em]"
    >
      {{ text }}
    </span>

    <!-- Without the icon it stays as a zero-width strut, so the button keeps the height it has with one -->
    <span
      class="ui-button__icon size-[1em] rounded-full aspect-square bg-accent flex items-center justify-center overflow-hidden"
      :class="{ 'w-0 invisible': !icon, 'order-first': leading }"
    >
      <IconPixelArrow
        v-if="icon"
        class="ui-button__arrow w-[55%]"
        :class="arrows[arrow].class"
        :style="{ '--fire-x': arrows[arrow].x, '--fire-y': arrows[arrow].y }"
      />
    </span>
  </span>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.ui-button--large {
  font-size: utopia.clamp(16, 28);

  .ui-button__icon {
    font-size: utopia.clamp(30, 40);
  }
}

.ui-button--medium {
  font-size: utopia.clamp(14, 18);

  .ui-button__icon {
    font-size: var(--ui-button-medium-icon);
  }
}

.ui-button__bg {
  scale: 1 1;
  transform: translateZ(0);
  transition: scale 0.6s var(--ease-spring-3);

  /* Hover only where it can, so a tap on a phone doesn't leave it stuck grown. A press grows it everywhere. */
  @media (hover: hover) {
    .ui-button:hover & {
      transition: scale 0.2s var(--ease-outCubic);
      scale: var(--scale-x) var(--scale-y);
    }
  }

  .ui-button:active & {
    transition: scale 0.15s var(--ease-outCubic);
    scale: var(--scale-x) var(--scale-y);
  }
}

.ui-button__arrow {
  @media (hover: hover) and (prefers-reduced-motion: no-preference) {
    .ui-button:hover & {
      animation: arrow-fire 0.65s both;
    }
  }
}

/* Annoyingly easing vars don't work in keyframes */
@keyframes arrow-fire {
  0% {
    translate: 0 0;
    scale: 1 1;
    filter: blur(0px);
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  12% {
    translate: calc(-30% * var(--fire-x)) calc(-30% * var(--fire-y));
    scale: 0.7 1.1;
    filter: blur(1px);
    animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  44% {
    translate: calc(260% * var(--fire-x)) calc(260% * var(--fire-y));
    scale: 1 1;
    filter: blur(1px);
    animation-timing-function: none;
  }
  45% {
    translate: calc(-260% * var(--fire-x)) calc(-260% * var(--fire-y));
    scale: 1 1;
    filter: blur(1px);
    animation-timing-function: linear(
      0,
      0.006,
      0.025 2.8%,
      0.101 6.1%,
      0.539 18.9%,
      0.721 25.3%,
      0.849 31.5%,
      0.937 38.1%,
      0.968 41.8%,
      0.991 45.7%,
      1.006 50.1%,
      1.015 55%,
      1.017 63.9%,
      1.001
    );
  }
  100% {
    translate: 0 0;
    scale: 1 1;
    filter: blur(0px);
  }
}
</style>
