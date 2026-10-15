<script lang="ts" setup>
import type { Themes } from '@/types/app'

interface Props {
  tag?: string
  theme?: Themes
  id?: string | null
}

const { tag = 'section', theme, id } = defineProps<Props>()

const el = useTemplateRef<HTMLElement>('el')

useThemeObserver(el, () => theme)
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
