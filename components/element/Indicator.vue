<script lang="ts" setup>
import { colours } from '@/tailwind.config'

interface Props {
  on: boolean
}

const { on = true } = defineProps<Props>()
const styles = computed(() => {
  return on
    ? {
        dot: colours['green-darker'],
        background: colours.green,
      }
    : {
        dot: colours['pink-darker'],
        background: colours.pink,
      }
})
</script>

<template>
  <svg
    viewBox="0 0 180 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      width="180"
      height="100"
      rx="50"
      :fill="styles.background"
    />

    <circle
      :cx="on ? '130' : '50'"
      cy="50"
      r="40"
      :fill="styles.dot"
    />

    <path
      :d="on ? 'M117 50.1429L126.75 60L143 37' : 'M34 50H66.5'"
      fill="none"
      stroke="white"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
