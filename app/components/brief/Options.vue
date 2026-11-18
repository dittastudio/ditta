<script lang="ts" setup>
interface Props {
  options: readonly string[]
  variant?: 'cards' | 'chips'
  multiple?: boolean
}

const { options, variant = 'cards', multiple = false } = defineProps<Props>()
const model = defineModel<string | string[] | undefined>()
const emit = defineEmits<{ picked: [option: string] }>()

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

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
</script>

<template>
  <div
    :class="variant === 'cards' ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'"
    role="group"
  >
    <button
      v-for="(option, index) in options"
      :key="option"
      type="button"
      :aria-pressed="isSelected(option)"
      class="flex items-center gap-3 text-left font-medium transition-colors duration-150 ease-outCubic"
      :class="[
        variant === 'cards' ? 'rounded-10 p-3 text-14 sm:text-16' : 'rounded-full px-4 py-2.5 text-14',
        isSelected(option) ? 'bg-black text-grey' : 'bg-white text-black only-hover:hover:bg-putty',
      ]"
      @click="toggle(option)"
    >
      <span
        v-if="variant === 'cards'"
        class="flex size-6 shrink-0 items-center justify-center rounded-5 text-12 font-mono"
        :class="isSelected(option) ? 'bg-grey text-black' : 'bg-putty text-black'"
      >
        {{ letters[index] }}
      </span>

      <span class="leading-tight">{{ option }}</span>
    </button>
  </div>
</template>
