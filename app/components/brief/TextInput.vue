<script lang="ts" setup>
import { useDocumentVisibility, usePreferredReducedMotion } from '@vueuse/core'

// Native attributes (type, placeholder, autocomplete, inputmode, aria-*) fall through to the <input>
defineOptions({ inheritAttrs: false })

interface Props {
  focusOnMount?: boolean
  small?: boolean
  // Examples shown in turn while the field is empty. The native placeholder should be the first, for screen readers.
  placeholders?: readonly string[]
}

const { focusOnMount = false, small = false, placeholders = [] } = defineProps<Props>()
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ submit: [] }>()

const input = useTemplateRef('input')

onMounted(() => {
  // On touch the browser scrolls the field into view itself (see useBriefScroll); elsewhere the brief frames it
  if (focusOnMount) input.value?.focus({ preventScroll: !isTouch() })
})

// The examples go round once and come to rest on the first, rather than looping for as long as the field is empty.
// They hold still while the tab is hidden, and don't move at all under reduced motion: they're only decoration.
const rotates = computed(() => placeholders.length > 1)
const reducedMotion = usePreferredReducedMotion()
const visibility = useDocumentVisibility()
const swaps = ref(0)
const example = computed(() => placeholders[swaps.value % placeholders.length])

watchEffect((onCleanup) => {
  if (!rotates.value || model.value || swaps.value >= placeholders.length) return
  if (reducedMotion.value === 'reduce' || visibility.value !== 'visible') return

  // A longer first hold, so the question gets read before anything moves
  const timer = setTimeout(() => swaps.value++, swaps.value === 0 ? 3500 : 2800)
  onCleanup(() => clearTimeout(timer))
})
</script>

<template>
  <div class="relative grid">
    <input
      ref="input"
      v-bind="$attrs"
      v-model="model"
      maxlength="200"
      enterkeyhint="next"
      class="w-full scroll-mt-[calc(var(--dock-height)+--spacing(13.5))] rounded-10 border border-white/25 bg-white/10 px-5 text-white outline-none transition-colors duration-200 ease-outCubic focus:border-olive aria-invalid:border-coral"
      :class="[
        small ? 'py-3 text-16' : 'py-4 text-20',
        rotates ? 'placeholder:text-transparent' : 'placeholder:text-white/40',
      ]"
      @keydown.enter.prevent="emit('submit')"
    />

    <!-- Stands in for the placeholder, which can't animate. Typing removes it at once, with no fade. -->
    <div
      v-if="rotates && !model"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 grid items-center border border-transparent px-5 text-white/40"
      :class="small ? 'text-16' : 'text-20'"
    >
      <Transition name="brief-placeholder">
        <span
          :key="example"
          class="col-start-1 row-start-1 truncate"
          >{{ example }}</span
        >
      </Transition>
    </div>
  </div>
</template>
