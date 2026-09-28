<script lang="ts" setup>
import type { Themes } from '@/types/app'

interface Props {
  tag?: string
  theme?: Themes
  id?: string | null
}

const { tag = 'section', theme, id } = defineProps<Props>()

const appStore = useAppStore()
const el = useTemplateRef<HTMLElement>('el')

let observer: IntersectionObserver | null = null

// The dock may mount after this section during hydration, so wait for its height rather than reading it once.
watch(
  [() => appStore.getDockHeight, el],
  ([height, target]) => {
    observer?.disconnect()
    observer = null

    if (!theme || !target || !height) return

    const halfHeader = Math.round(height / 2)
    const offset = halfHeader + 30
    const rootMargin = `-${offset}px 0px -${window.innerHeight - offset - 1}px 0px`

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          appStore.setTheme(theme)
        }
      },
      { rootMargin, threshold: 0 },
    )
    observer.observe(target)
  },
  { immediate: true },
)

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <component
    :is="tag"
    ref="el"
    :id="id"
    :class="theme ? themeClasses[theme] : ''"
  >
    <slot />
  </component>
</template>
