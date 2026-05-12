<script setup lang="ts">
import type { Themes } from '@/types/app'
import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'

interface Props {
  theme?: Themes
  text?: string
}

const { theme = 'light', text } = defineProps<Props>()

const root = ref<HTMLElement | null>(null)
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
    class="ui-button relative isolate select-none inline-flex items-center gap-[0.71em] font-medium leading-none rounded-full py-2.5 md:py-3.75 pr-2.5 md:pr-3.75 pl-5 md:pl-6"
  >
    <span
      class="ui-button__bg absolute inset-0 -z-1 rounded-[inherit]"
      :class="[theme ? themeClasses[theme as Themes] : '']"
    />

    <span
      v-if="text"
      class="opacity-0 mt-[-0.15em] mb-[-0.1em]"
      aria-hidden="true"
    >
      {{ text }}
    </span>

    <span
      v-if="text"
      class="absolute mt-[-0.15em] mb-[-0.1em]"
    >
      <!-- {{ text }} -->
      <UiTextMorph
        :text="text"
        :auto-animate="false"
        :min-weight="500"
      />
    </span>

    <span class="ui-button__icon size-[1em] rounded-full aspect-square bg-accent flex items-center justify-center">
      <IconPixelArrow class="arrow w-5 rotate-45" />
    </span>
  </span>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.ui-button {
  font-size: utopia.clamp(16, 28);
}

.ui-button__icon {
  font-size: utopia.clamp(30, 40);
}

.ui-button__bg {
  scale: 1 1;
  transition: scale 0.8s var(--ease-spring-3);

  .ui-button:hover & {
    transition: scale 0.4s var(--ease-out);
    scale: var(--scale-x) var(--scale-y);
  }
}
</style>
