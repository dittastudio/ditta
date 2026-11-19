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
  // On touch the browser scrolls the field into view itself (see useBriefScroll); elsewhere the brief frames it
  if (focusOnMount) input.value?.focus({ preventScroll: !isTouch() })
})
</script>

<template>
  <input
    ref="input"
    v-model="model"
    maxlength="200"
    enterkeyhint="next"
    class="w-full scroll-mt-[calc(var(--dock-height)+--spacing(13.5))] rounded-10 border border-white/25 bg-white/10 px-5 text-white outline-none transition-colors duration-200 ease-outCubic placeholder:text-white/40 focus:border-olive aria-invalid:border-coral"
    :class="small ? 'py-3 text-16' : 'py-4 text-20'"
    @keydown.enter.prevent="emit('submit')"
  />
</template>
