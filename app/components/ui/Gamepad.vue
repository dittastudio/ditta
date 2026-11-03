<script lang="ts" setup>
import type { MarioButton } from '@/composables/useMario'

import IconPixelTriangle from '@/assets/icons/pixel-triangle.svg'

interface Props {
  visible: boolean
}

const { visible } = defineProps<Props>()

const emit = defineEmits<{
  press: [button: MarioButton]
  release: [button: MarioButton]
}>()

const pressed = ref(new Set<MarioButton>())

// Capturing keeps the finger on its button even if it slides off, so release always arrives
const onDown = (button: MarioButton, event: PointerEvent) => {
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  if (pressed.value.has(button)) return
  pressed.value.add(button)
  emit('press', button)
}

const onUp = (button: MarioButton) => {
  if (!pressed.value.delete(button)) return
  emit('release', button)
}

const buttonEvents = (button: MarioButton) => ({
  pointerdown: (event: PointerEvent) => onDown(button, event),
  pointerup: () => onUp(button),
  pointercancel: () => onUp(button),
  lostpointercapture: () => onUp(button),
  contextmenu: (event: Event) => event.preventDefault(),
})
</script>

<template>
  <div
    class="fixed inset-x-0 bottom-0 z-40 hidden only-touch:block px-[calc(var(--app-gutter-outer)*0.5)] [-webkit-tap-highlight-color:transparent] pb-[max(--spacing(5),env(safe-area-inset-bottom))] pointer-events-none transition-[translate] duration-300 ease-outCubic"
    :class="{ 'translate-y-full': !visible }"
  >
    <div
      class="bg-putty p-[calc(var(--app-gutter-outer)*0.5)] rounded-10 touch-none shadow-lg"
      :class="{ 'pointer-events-auto': visible }"
      @touchstart.prevent
      @touchend.prevent
    >
      <div class="flex items-end justify-between bg-charcoal p-[calc(var(--app-gutter-outer)*0.5)] rounded-5">
        <div class="flex gap-1 bg-putty p-1 rounded-[4px]">
          <button
            v-for="button in ['left', 'right'] as const"
            :key="button"
            type="button"
            tabindex="-1"
            class="flex items-center justify-center size-18 bg-black text-white touch-none select-none [-webkit-touch-callout:none] transition-[scale] duration-75 ease-out data-pressed:scale-90 rounded-[3px]"
            :class="{ 'pointer-events-auto': visible }"
            :data-pressed="pressed.has(button) || undefined"
            v-on="buttonEvents(button)"
          >
            <IconPixelTriangle
              class="h-6 w-auto"
              :class="{
                '-scale-x-100 -translate-x-1': button === 'left',
                'translate-x-1': button === 'right',
              }"
            />
          </button>
        </div>

        <div class="bg-putty p-1 rounded-5">
          <button
            type="button"
            tabindex="-1"
            class="relative block size-18 before:absolute before:inset-0 before:border-t-3 before:border-r-3 before:border-t-black/30 before:border-r-black/30 before:rounded-[inherit] after:absolute after:inset-0 after:border-b-3 after:border-l-3 after:border-b-white/40 after:border-l-white/40 after:rounded-[inherit] rounded-full bg-rage touch-none select-none [-webkit-touch-callout:none] transition-[scale] duration-75 ease-out data-pressed:scale-90 shadow-lg"
            :class="{ 'pointer-events-auto': visible }"
            :data-pressed="pressed.has('jump') || undefined"
            v-on="buttonEvents('jump')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
