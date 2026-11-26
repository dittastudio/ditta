<script lang="ts" setup>
import { useDocumentVisibility, usePreferredReducedMotion } from '@vueuse/core'
import { defineSound } from '@web-kits/audio'
import { tap, tick } from '@@/.web-kits/core'
import { BRIEF_LINK_MAX, BRIEF_TEXT_MAX } from '#shared/schemas/brief'

// Native attributes (type, placeholder, autocomplete, inputmode, aria-*) fall through to the <input>
defineOptions({ inheritAttrs: false })
// Every field needs a name for autofill. The caller's (a question's key) wins, since $attrs is bound after it.
const fallbackName = useId()

interface Props {
  focusOnMount?: boolean
  small?: boolean
  // Examples shown in turn while the field is empty. The native placeholder should be the first, for screen readers.
  placeholders?: readonly string[]
  // Joined to a field below ('top') or above ('bottom'): square on the side where they meet (see LinkInput)
  join?: 'top' | 'bottom'
}

const { focusOnMount = false, small = false, placeholders = [], join } = defineProps<Props>()
const corners = computed(() => ({ top: 'rounded-t-10', bottom: 'rounded-b-10' })[join ?? ''] ?? 'rounded-10')
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ submit: [] }>()
// A control inside the field on the right, such as a row's remove button. The field leaves room for it.
const slots = defineSlots<{ end?: () => unknown }>()

const input = useTemplateRef('input')
const attrs = useAttrs()

// The outline says how the answer stands: coral with an error, green once it's filled in and nothing's wrong with
// it, otherwise faint, half white on hover and full white while it's being typed into
const outline = computed(() => {
  if (attrs['aria-invalid']) return 'border-coral'
  if (model.value.trim()) return 'border-olive'
  return 'border-ash only-hover:hover:not-focus:border-white/50 focus:border-white'
})

// A tick for every key typed and a tap for every one deleted, like a phone keyboard with its clicks on. Pastes,
// drops and autocorrect swaps aren't keys, so they stay quiet.
const soundTick = defineSound(tick)
const soundTap = defineSound(tap)
const { play } = useAudio()

const keySounds: Partial<Record<string, typeof soundTick>> = {
  insertText: soundTick,
  insertCompositionText: soundTick,
  deleteContentBackward: soundTap,
  deleteContentForward: soundTap,
}

function onInput(event: Event) {
  const sound = keySounds[(event as InputEvent).inputType]
  if (sound) play(sound)
}

// Enter also confirms a word being composed (Chinese, Japanese and the like), which mustn't count as Next. Safari ends
// the composition before its keydown, so its keyCode of 229 is the only sign. Only a bare Enter: Shift+Enter is Back,
// which the brief handles (see useBriefKeys).
function onEnter(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  emit('submit')
}

onMounted(() => {
  if (focusOnMount) input.value?.focus()
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

  // A short first hold: long enough for the step to settle, soon enough that the rotation reads as part of arriving
  const timer = setTimeout(() => swaps.value++, swaps.value === 0 ? 1500 : 2800)
  onCleanup(() => clearTimeout(timer))
})
</script>

<template>
  <!-- No fill, only the outline. Chrome paints its own fill on autofilled fields that background-color can't undo,
       so an inset shadow in the page's black covers it. -->
  <div class="relative grid w-full min-w-0">
    <input
      ref="input"
      :name="fallbackName"
      v-bind="$attrs"
      v-model="model"
      :maxlength="$attrs.type === 'url' ? BRIEF_LINK_MAX : BRIEF_TEXT_MAX"
      enterkeyhint="next"
      class="w-full scroll-my-4 border px-5 text-white outline-none autofill:shadow-[inset_0_0_0_100vmax_var(--color-black)] autofill:[-webkit-text-fill-color:var(--color-white)] transition-[color,background-color,border-color,border-radius] duration-200 ease-outCubic"
      :class="[
        corners,
        outline,
        small ? 'py-3 text-16' : 'py-4 text-16 md:text-20',
        rotates ? 'placeholder:text-transparent' : 'placeholder:text-white/40',
        slots.end ? 'pr-14' : '',
      ]"
      @keydown.enter.exact="onEnter"
      @input="onInput"
    />

    <div
      v-if="slots.end"
      class="absolute inset-y-0 right-0 flex items-center"
    >
      <slot name="end" />
    </div>

    <!-- Stands in for the placeholder, which can't animate. Typing removes it at once, with no fade. -->
    <div
      v-if="rotates && !model"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 grid items-center border border-transparent px-5 text-white/40"
      :class="[small ? 'text-16' : 'text-16 md:text-20', slots.end ? 'pr-14' : '']"
    >
      <!-- The next example arrives a beat behind, so the two cross rather than blur into each other -->
      <Transition
        name="brief-rise"
        enter-active-class="brief-rise-enter-active delay-60"
      >
        <span
          :key="example"
          class="col-start-1 row-start-1 truncate"
          >{{ example }}</span
        >
      </Transition>
    </div>
  </div>
</template>
