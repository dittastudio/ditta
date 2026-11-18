<script lang="ts" setup>
// Native attributes (type, placeholder, autocomplete, inputmode, aria-*) fall through to the <input>
interface Props {
  focusOnMount?: boolean
  small?: boolean
}

const { focusOnMount = false, small = false } = defineProps<Props>()
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ submit: [] }>()

const input = useTemplateRef('input')

onMounted(() => {
  if (focusOnMount) input.value?.focus({ preventScroll: true })
})
</script>

<template>
  <input
    ref="input"
    v-model="model"
    maxlength="200"
    enterkeyhint="next"
    class="w-full rounded-10 bg-white px-4 text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-black aria-invalid:ring-2 aria-invalid:ring-rage"
    :class="small ? 'py-2 text-14' : 'py-3 text-16'"
    @keydown.enter.prevent="emit('submit')"
  />
</template>
