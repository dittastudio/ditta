<script lang="ts" setup>
type ColumnMap = number | Partial<Record<string, number>>

interface Props {
  columns?: ColumnMap
  innerGutter?: string
  outerGutter?: string
  maxWidth?: string
  breakpoints?: string[]
  color?: string
  zIndex?: number
}

const {
  columns = 12,
  innerGutter = '16px',
  outerGutter = '16px',
  maxWidth = 'none',
  breakpoints = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
  color = 'rgb(0 0 255 / 0.2)',
  zIndex = 9999,
} = defineProps<Props>()

// One reactive boolean per breakpoint. Order preserved (smallest -> largest).
const breakpointMatches = breakpoints.map((name) => ({
  name,
  matches: useAtMedia(getMediaQuery(name)),
}))

// Pick the largest matching breakpoint that has a column value defined.
const activeColumns = computed(() => {
  if (typeof columns === 'number') return columns

  const fallback = columns.base ?? 12
  for (let i = breakpointMatches.length - 1; i >= 0; i--) {
    const { name, matches } = breakpointMatches[i]!
    if (matches.value && columns[name] !== undefined) return columns[name]!
  }
  return fallback
})
</script>

<template>
  <div>
    <input
      class="peer fixed bottom-5 right-5 size-12 cursor-pointer appearance-none rounded-full bg-white/50 shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-white/80 checked:bg-white"
      :style="{ zIndex: zIndex + 1 }"
      type="checkbox"
    />

    <div
      class="pointer-events-none fixed inset-0 mx-auto h-screen w-full opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
      :style="{
        zIndex,
        maxWidth,
        paddingLeft: outerGutter,
        paddingRight: outerGutter,
      }"
    >
      <div
        class="grid h-full"
        :style="{
          gridTemplateColumns: `repeat(${activeColumns}, 1fr)`,
          columnGap: innerGutter,
        }"
      >
        <div
          v-for="i in activeColumns"
          :key="i"
          :style="{ background: color }"
        />
      </div>
    </div>
  </div>
</template>
