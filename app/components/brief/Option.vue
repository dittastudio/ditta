<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { defineSound } from '@web-kits/audio'
import { hover } from '@@/.web-kits/core'

interface Props {
  value: string
  type: 'radio' | 'checkbox'
  name: string
  shortcut?: string
  invalid?: boolean
  // Layout for the label's text, which is drawn twice: white, and a black copy the fill reveals
  contentClass?: HTMLAttributes['class']
}

const { value, type, name, shortcut, invalid = false, contentClass } = defineProps<Props>()
const model = defineModel<string | string[] | undefined>()
const emit = defineEmits<{ pick: [] }>()

defineSlots<{ default(): unknown }>()

const root = useTemplateRef('root')
const fill = useTemplateRef('fill')
const flash = useTemplateRef('flash')
const content = useTemplateRef('content')
const ink = useTemplateRef('ink')

const checked = computed(() => (Array.isArray(model.value) ? model.value.includes(value) : model.value === value))

const pixels = usePixelFill({ root, fill, flash, content, ink })

// Where the option was pressed, so the fill spreads from there. A pick from the keyboard has none, and fills from the
// centre.
let pressed: { x: number; y: number; at: number } | undefined

function onPointerdown(event: PointerEvent) {
  const rect = root.value?.getBoundingClientRect()
  if (rect) pressed = { x: event.clientX - rect.left, y: event.clientY - rect.top, at: performance.now() }
}

// A tick as the pointer moves onto an option. Mouse only: on touch, pointerenter comes with the tap, which already
// plays the pick sound.
const { play } = useAudio()
const soundHover = defineSound(hover)

function onPointerenter(event: PointerEvent) {
  if (event.pointerType === 'mouse') play(soundHover)
}

// A press on the card would focus its input the way a label does, and the browser would jump the page to bring that
// input into view: it's the card's top-left corner, off the screen when only the bottom of the card is showing. The
// card focuses its input without scrolling and then picks it. The input's own clicks (Space, the brief's number keys, the click below) carry on as usual.
// Focus moved from code would otherwise count as keyboard focus and draw the dashed ring, which a press (any click
// with a `detail`, its click count) shouldn't.
const input = useTemplateRef('input')

function onClick(event: MouseEvent) {
  if (!input.value || event.target === input.value) return
  event.preventDefault()
  input.value.focus({ preventScroll: true, focusVisible: event.detail === 0 })
  input.value.click()
}

function takePoint() {
  const point = pressed && performance.now() - pressed.at < 1000 ? pressed : undefined
  pressed = undefined
  return point
}

// Picked from anywhere, including the brief's number keys and a restart: an option unpicked because another radio
// took over dissolves too
watch(checked, (on) => pixels.set(on, on ? takePoint() : undefined))

onMounted(() => pixels.init(checked.value))
</script>

<template>
  <!-- A picked option keeps a dashed ring while focused: moving between ticked boxes, that's the only sign of where
       focus is -->
  <label
    ref="root"
    class="group/option relative isolate cursor-pointer touch-manipulation overflow-hidden text-left select-none has-checked:has-focus-visible:outline-1 has-checked:has-focus-visible:outline-dashed has-checked:has-focus-visible:outline-offset-4 has-checked:has-focus-visible:outline-white/50"
    @pointerenter="onPointerenter"
    @pointerdown="onPointerdown"
    @click="onClick"
  >
    <input
      ref="input"
      v-model="model"
      :type="type"
      :name="name"
      :value="value"
      :aria-keyshortcuts="shortcut"
      class="sr-only"
      @change="emit('pick')"
    />

    <!-- The border is its own layer under the fill, so the fill covers it cell by cell. Coral while the question still
         needs an answer, otherwise faint, half white on hover and full white while focused from the keyboard. -->
    <span
      class="pointer-events-none absolute inset-0 rounded-[inherit] border transition-colors duration-hover ease-outCubic"
      :class="
        invalid && !checked
          ? 'border-coral'
          : 'border-ash only-hover:group-hover/option:group-not-has-focus-visible/option:border-white/50 group-has-focus-visible/option:border-white'
      "
    />

    <!-- Hidden until mounted, apart from an option that's already picked, so it renders picked before the fill takes over -->
    <span
      ref="fill"
      aria-hidden="true"
      class="pointer-events-none invisible absolute inset-0 bg-olive group-has-checked/option:visible motion-reduce:transition-opacity motion-reduce:duration-500 motion-reduce:ease-outQuart"
    />

    <span
      ref="content"
      class="relative z-1 text-white group-has-checked/option:invisible motion-reduce:transition-colors motion-reduce:duration-500 motion-reduce:ease-outQuart"
      :class="contentClass"
    >
      <slot />
    </span>

    <!-- The picked copy, black on the fill. Icons can follow it: --icon-ring outlines what would vanish into the fill
         (an olive dot) in the same black, and --icon-solid turns a full-colour logo black with it -->
    <span
      ref="ink"
      aria-hidden="true"
      class="pointer-events-none invisible absolute inset-0 z-2 text-black [--icon-ring:currentcolor] [--icon-solid:currentcolor] group-has-checked/option:visible"
      :class="contentClass"
    >
      <slot />
    </span>

    <span
      ref="flash"
      aria-hidden="true"
      class="pointer-events-none invisible absolute inset-0 z-3 bg-olive-pale"
    />
  </label>
</template>
