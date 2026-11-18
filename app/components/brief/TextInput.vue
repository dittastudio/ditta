<script lang="ts" setup>
interface Props {
  type?: 'text' | 'email' | 'url'
  placeholder?: string
  autocomplete?: string
  autofocus?: boolean
  label?: string
  small?: boolean
}

const {
  type = 'text',
  placeholder,
  autocomplete = 'off',
  autofocus = false,
  label,
  small = false,
} = defineProps<Props>()
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ submit: [] }>()

const input = useTemplateRef('input')

onMounted(() => {
  if (autofocus) input.value?.focus({ preventScroll: true })
})

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <input
    ref="input"
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    :aria-label="label"
    :inputmode="type === 'email' ? 'email' : type === 'url' ? 'url' : undefined"
    maxlength="200"
    enterkeyhint="next"
    class="w-full rounded-10 bg-white px-4 text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-black"
    :class="small ? 'py-2 text-14' : 'py-3 text-16'"
    @keydown.enter.prevent="emit('submit')"
  />
</template>
