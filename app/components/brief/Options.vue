<script lang="ts" setup>
import { onKeyStroke } from '@vueuse/core'

interface Props {
  options: readonly string[]
  descriptions?: Partial<Record<string, string>>
  variant?: 'cards' | 'chips'
  multiple?: boolean
  // Letter keys (A, B, C…) pick options. Only the screen's main question listens.
  shortcuts?: boolean
}

const { options, descriptions = {}, variant = 'cards', multiple = false, shortcuts = false } = defineProps<Props>()
const model = defineModel<string | string[] | undefined>()
const emit = defineEmits<{ picked: [option: string] }>()

// Title-only cards are short enough to sit two to a row even on a phone
const hasDescriptions = computed(() => options.some((option) => descriptions[option]))

const isSelected = (option: string) =>
  Array.isArray(model.value) ? model.value.includes(option) : model.value === option

function toggle(option: string) {
  if (multiple) {
    const current = Array.isArray(model.value) ? model.value : []
    model.value = current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
    return
  }

  model.value = option
  emit('picked', option)
}

onKeyStroke((event) => {
  if (!shortcuts || event.metaKey || event.ctrlKey || event.altKey) return
  if ((event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]')) return

  const index = event.key.toLowerCase().charCodeAt(0) - 97
  const option = event.key.length === 1 ? options[index] : undefined
  if (option) toggle(option)
})
</script>

<template>
  <div
    v-if="variant === 'cards'"
    role="group"
    class="grid gap-2.5"
    :class="hasDescriptions ? 'sm:grid-cols-2' : 'grid-cols-2'"
  >
    <button
      v-for="option in options"
      :key="option"
      type="button"
      :aria-pressed="isSelected(option)"
      class="pokeable flex flex-col items-start gap-4 rounded-10 border bg-white/10 text-left transition-[border-color,background-color,scale] duration-200 ease-outCubic md:gap-5"
      :class="[
        hasDescriptions ? 'p-5 md:p-7.5' : 'p-4 md:p-6',
        isSelected(option) ? 'border-olive' : 'border-white/25 only-hover:hover:border-white/50',
      ]"
      @click="toggle(option)"
    >
      <span
        class="font-medium leading-tight trim-both md:text-20"
        :class="hasDescriptions ? 'text-18' : 'text-16'"
        >{{ option }}</span
      >

      <span
        v-if="descriptions[option]"
        class="text-14 leading-snug text-pretty opacity-60 md:text-16"
      >
        {{ descriptions[option] }}
      </span>
    </button>
  </div>

  <div
    v-else
    role="group"
    class="flex flex-wrap gap-2.5"
  >
    <button
      v-for="option in options"
      :key="option"
      type="button"
      :aria-pressed="isSelected(option)"
      class="pokeable rounded-full px-5 py-3 text-16 font-medium leading-none transition-colors duration-200 ease-outCubic"
      :class="isSelected(option) ? 'bg-white text-black' : 'bg-white/10 text-white only-hover:hover:bg-white/20'"
      @click="toggle(option)"
    >
      <span class="block trim-both">{{ option }}</span>
    </button>
  </div>
</template>
