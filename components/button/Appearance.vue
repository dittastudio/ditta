<script lang="ts" setup>
import { colourBackground, colourText } from '@/utilities/maps'

export interface Props {
  backgroundColor?: string
  textColor?: string
}

const {
  backgroundColor = 'offwhite',
  textColor = 'offblack',
} = defineProps<Props>()

const classes = computed(() => ([colourText[textColor], colourBackground[backgroundColor]]))
</script>

<template>
  <span
    :class="classes"
    class="px-[1em] py-[0.5em] w-[inherit] inline-flex items-center justify-center rounded-lg font-medium text-16 text-center capitalize"
  >
    <slot />
  </span>
</template>
