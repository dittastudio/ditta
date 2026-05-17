<script setup lang="ts">
import type { Themes } from '@/types/app'
import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'

interface Props {
  theme?: Themes
  text?: string
  size?: 'large' | 'medium'
}

const { theme = 'light', text, size = 'large' } = defineProps<Props>()

const root = useTemplateRef('root')
const width = ref(0)
const height = ref(0)

const scaleX = computed(() => (width.value ? (width.value + 6) / width.value : 1))
const scaleY = computed(() => (height.value ? (height.value + 6) / height.value : 1))

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
    class="ui-button relative isolate select-none inline-flex items-center gap-[0.71em] font-medium leading-none rounded-full"
    :class="[
      `ui-button--${size}`,
      size === 'large' ? 'py-2.5 md:py-3.75 pr-2.5 md:pr-3.75 pl-5 md:pl-6' : 'py-2 pr-2 pl-4',
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

    <span
      class="ui-button__icon size-[1em] rounded-full aspect-square bg-accent flex items-center justify-center overflow-hidden"
    >
      <IconPixelArrow class="ui-button__arrow w-[55%] rotate-45" />
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
    font-size: utopia.clamp(24, 30);
  }
}

.ui-button__bg {
  scale: 1 1;
  transform: translateZ(0);
  transition: scale 0.8s var(--ease-spring-3);

  .ui-button:hover & {
    transition: scale 0.4s var(--ease-out);
    scale: var(--scale-x) var(--scale-y);
  }
}

.ui-button__arrow {
  .ui-button:hover & {
    animation: arrow-fire 0.8s both;
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
    translate: -30% 30%;
    scale: 0.7 1.1;
    filter: blur(1px);
    animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  44% {
    translate: 260% -260%;
    scale: 1 1;
    filter: blur(1px);
    animation-timing-function: none;
  }
  45% {
    translate: -260% 260%;
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
