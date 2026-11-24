<script lang="ts" setup>
import { useDocumentVisibility, usePreferredReducedMotion } from '@vueuse/core'
import { defineSound } from '@web-kits/audio'
import { tap, tick } from '@@/.web-kits/core'
import IconClose from '@/assets/icons/close.svg'
import { BRIEF_LINK_MAX, BRIEF_TEXT_MAX } from '#shared/schemas/brief'

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

// Empties the field and hands focus straight back, so the next answer can be typed without reaching for the field
function clear() {
  model.value = ''
  play(soundTap)
  input.value?.focus({ preventScroll: true })
}

// Enter also confirms a word being composed (Chinese, Japanese and the like), which mustn't count as Next. Safari ends
// the composition before its keydown, so its keyCode of 229 is the only sign.
function onEnter(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  emit('submit')
}

onMounted(() => {
  // The browser only scrolls for a focus that opens the keyboard (on touch, with no field holding it open already, as
  // Shell does across a Next). Every other time the brief frames the field itself (see useBriefScroll).
  if (focusOnMount) input.value?.focus({ preventScroll: !isTouch() || opensKeyboard(document.activeElement) })
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
  <div class="relative grid w-full min-w-0">
    <input
      ref="input"
      v-bind="$attrs"
      v-model="model"
      :maxlength="$attrs.type === 'url' ? BRIEF_LINK_MAX : BRIEF_TEXT_MAX"
      enterkeyhint="next"
      class="peer w-full scroll-mt-[calc(var(--dock-height)+--spacing(13.5))] rounded-10 border border-white/25 bg-white/10 px-5 text-white outline-none transition-colors duration-200 ease-outCubic focus:border-olive aria-invalid:border-coral"
      :class="[
        small ? 'py-3 text-16' : 'py-4 text-16 md:text-20',
        rotates ? 'placeholder:text-transparent' : 'placeholder:text-white/40',
        model ? 'pr-14' : '',
      ]"
      @keydown.enter="onEnter"
      @input="onInput"
    />

    <!-- Only shown while the field has focus: an answer that's done doesn't need a way to wipe it. Hidden by
         opacity rather than removed, so it fades both ways. mousedown is held back so the field keeps focus, and on
         touch the keyboard stays up. -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-outCubic"
      leave-active-class="transition-opacity duration-200 ease-outCubic"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <button
        v-if="model"
        type="button"
        tabindex="-1"
        aria-label="Clear"
        class="group pointer-events-none absolute inset-y-0 right-0 flex touch-manipulation items-center pr-5 pl-3 text-white/60 opacity-0 transition-[color,opacity] duration-200 ease-outCubic peer-focus:pointer-events-auto peer-focus:opacity-100 only-hover:hover:text-white"
        @mousedown.prevent
        @click="clear"
      >
        <span
          class="grid size-6 place-items-center rounded-full bg-white/15 transition-colors duration-200 ease-outCubic only-hover:group-hover:bg-white/25"
        >
          <IconClose class="size-3.5" />
        </span>
      </button>
    </Transition>

    <!-- Stands in for the placeholder, which can't animate. Typing removes it at once, with no fade. -->
    <div
      v-if="rotates && !model"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 grid items-center border border-transparent px-5 text-white/40"
      :class="small ? 'text-16' : 'text-16 md:text-20'"
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
