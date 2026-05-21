<script lang="ts" setup>
import type { Themes } from '@/types/app'

interface Props {
  tag?: string
  theme?: Themes
  id?: string
}

const { tag = 'section', theme, id } = defineProps<Props>()

const appStore = useAppStore()
const el = useTemplateRef<HTMLElement>('el')

onMounted(() => {
  if (!theme || !el.value) return

  const height = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-height'))
  if (!height) return

  const offset = Math.round(height / 2)
  const rootMargin = `-${offset}px 0px -${window.innerHeight - offset - 1}px 0px`

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        appStore.setTheme(theme)
      }
    },
    { rootMargin, threshold: 0 },
  )
  observer.observe(el.value)

  onUnmounted(() => observer.disconnect())
})
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
