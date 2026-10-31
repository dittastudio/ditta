<script lang="ts" setup>
import IconPixelTriangle from '@/assets/icons/pixel-triangle.svg'

type GamepadButton = 'left' | 'right' | 'jump'

interface Props {
  visible: boolean
}

const { visible } = defineProps<Props>()

const emit = defineEmits<{
  press: [button: GamepadButton]
  release: [button: GamepadButton]
}>()

const pressed = ref(new Set<GamepadButton>())

// Capturing keeps the finger on its button even if it slides off, so release always arrives
const onDown = (button: GamepadButton, event: PointerEvent) => {
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  if (pressed.value.has(button)) return
  pressed.value.add(button)
  emit('press', button)
}

const onUp = (button: GamepadButton) => {
  if (!pressed.value.delete(button)) return
  emit('release', button)
}

const buttonEvents = (button: GamepadButton) => ({
  pointerdown: (event: PointerEvent) => onDown(button, event),
  pointerup: () => onUp(button),
  pointercancel: () => onUp(button),
  lostpointercapture: () => onUp(button),
  contextmenu: (event: Event) => event.preventDefault(),
})
</script>

<template>
  <div
    class="fixed inset-x-0 bottom-0 z-40 hidden only-touch:flex items-end justify-between px-(--app-gutter-outer) pb-[max(var(--app-gutter-outer),env(safe-area-inset-bottom))] pointer-events-none transition-translate duration-300 ease-outCubic"
    :class="{ 'translate-y-full': !visible }"
    aria-hidden="true"
  >
    <div class="flex gap-3">
      <button
        v-for="button in ['left', 'right'] as const"
        :key="button"
        type="button"
        tabindex="-1"
        class="flex items-center justify-center size-16 bg-black text-white touch-none select-none [-webkit-touch-callout:none] transition-scale duration-75 ease-out data-pressed:scale-90"
        :class="{ 'pointer-events-auto': visible }"
        :data-pressed="pressed.has(button) || undefined"
        v-on="buttonEvents(button)"
      >
        <IconPixelTriangle
          class="h-6 w-auto"
          :class="{ '-scale-x-100': button === 'left' }"
        />
      </button>
    </div>

    <button
      type="button"
      tabindex="-1"
      class="size-20 rounded-full bg-rage border-4 border-rage-dark touch-none select-none [-webkit-touch-callout:none] transition-scale duration-75 ease-out data-pressed:scale-90"
      :class="{ 'pointer-events-auto': visible }"
      :data-pressed="pressed.has('jump') || undefined"
      v-on="buttonEvents('jump')"
    />
  </div>
</template>
