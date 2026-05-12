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

const BUTTON_SIZE = 48

const pos = ref<{ x: number; y: number } | null>(null)
const dragging = ref(false)
const moved = ref(false)
let startPointer = { x: 0, y: 0 }
let startPos = { x: 0, y: 0 }

onMounted(() => {
  pos.value = {
    x: window.innerWidth - 20 - BUTTON_SIZE,
    y: window.innerHeight - 20 - BUTTON_SIZE,
  }
})

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function onPointerDown(e: PointerEvent) {
  dragging.value = true
  moved.value = false
  startPointer = { x: e.clientX, y: e.clientY }
  startPos = { ...pos.value }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  const dx = e.clientX - startPointer.x
  const dy = e.clientY - startPointer.y
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.value = true
  pos.value = {
    x: clamp(startPos.x + dx, 0, window.innerWidth - BUTTON_SIZE),
    y: clamp(startPos.y + dy, 0, window.innerHeight - BUTTON_SIZE),
  }
}

function onPointerUp() {
  dragging.value = false
}

function onClick(e: MouseEvent) {
  if (moved.value) e.preventDefault()
}
</script>

<template>
  <div>
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition-opacity duration-300"
    >
      <input
        v-if="pos"
        class="peer fixed size-12 appearance-none rounded-full bg-white/50 shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-white/80 checked:bg-white"
        :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
        :style="{ zIndex: zIndex + 1, left: `${pos.x}px`, top: `${pos.y}px` }"
        type="checkbox"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @click="onClick"
      />
    </Transition>

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
