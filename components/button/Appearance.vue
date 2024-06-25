<script lang="ts" setup>
import { colourBackground, colourText } from '@/utilities/maps'
import type { colours } from '@/tailwind.config'

export interface Props {
  backgroundColor?: keyof typeof colours
  textColor?: keyof typeof colours
  size?: 'small' | 'large'
}

const {
  backgroundColor = 'offwhite',
  textColor = 'offblack',
  size = 'small',
} = defineProps<Props>()

const classes = computed(() => {
  return [
    'relative isolate w-[inherit] inline-flex items-center justify-center rounded-lg font-medium text-center capitalize',
    'before:absolute before:inset-0 before:bg-white/10 before:opacity-0 before:-z-1 before:rounded-[inherit]',
    'before:transition-opacity before:duration-200 before:ease-smooth',
    'group-hover/link:before:opacity-100 group-active/link:before:opacity-0',
    colourText[textColor],
    colourBackground[backgroundColor],
    size === 'small' ? 'px-[1em] py-[0.5em] text-16' : 'px-[1.5em] py-[0.75em] text-16 md:text-18',
  ]
})
</script>

<template>
  <span
    :class="classes"
  >
    <span class="z-1">
      <slot />
    </span>
  </span>
</template>
