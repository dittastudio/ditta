<script lang="ts" setup>
import { defineSound } from '@web-kits/audio'
import { checkbox, radio } from '@@/.web-kits/core'

interface Props {
  options: readonly string[]
  descriptions?: Partial<Record<string, string>>
  variant?: 'cards' | 'chips'
  multiple?: boolean
}

const { options, descriptions = {}, variant = 'cards', multiple = false } = defineProps<Props>()
const model = defineModel<string | string[] | undefined>()

// Native radios and checkboxes under the cards: they bring the semantics, Space to pick, and arrows between radios.
// One name per group, so a follow-up's radios never join the question above it.
const name = useId()
const type = computed(() => (multiple ? 'checkbox' : 'radio'))
const role = computed(() => (multiple ? 'group' : 'radiogroup'))

// Played when someone picks (or unpicks) an option, not when the answer is set from outside
const soundCheckbox = defineSound(checkbox)
const soundRadio = defineSound(radio)
const { play } = useAudio()
const playPick = () => play(multiple ? soundCheckbox : soundRadio)

// A checkbox v-model needs an array to add to, or it binds a single true/false instead
const selected = computed({
  get: () => (multiple ? (Array.isArray(model.value) ? model.value : []) : model.value),
  set: (value) => {
    model.value = value
  },
})

// Title-only cards are short enough to sit two to a row even on a phone
const hasDescriptions = computed(() => options.some((option) => descriptions[option]))

// Checkboxes don't move on arrows natively, unlike radios. Here arrows only move focus, Space still toggles,
// and every checkbox stays a Tab stop, so this adds to the usual keys rather than replacing them.
const moves: Partial<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

function onKeydown(event: KeyboardEvent) {
  if (!multiple) return

  const inputs = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLInputElement>('input')]
  const index = inputs.indexOf(event.target as HTMLInputElement)
  if (index === -1) return

  const move = moves[event.key]
  const to =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? inputs.length - 1
        : move
          ? (index + move + inputs.length) % inputs.length
          : -1
  if (to === -1) return

  event.preventDefault()
  inputs[to]?.focus()
}

// 1–9 pick the first nine options (see useBriefKeys), announced through aria-keyshortcuts
const shortcut = (index: number) => (index < 9 ? String(index + 1) : undefined)

// The same rule as a text field's outline (see TextInput): green once picked, coral while the question still needs
// an answer, otherwise faint, turning white on hover and while focused from the keyboard. The input is hidden, so the
// label shows it. A picked option is green whether focused or not, so it also keeps a dashed ring while focused:
// moving between ticked boxes, that's the only sign of where focus is.
const attrs = useAttrs()
const outline = computed(() => [
  'border border-ash has-checked:border-olive has-checked:bg-olive has-checked:text-black',
  attrs['aria-invalid']
    ? 'not-has-checked:border-coral'
    : 'only-hover:hover:not-has-checked:border-white not-has-checked:has-focus-visible:border-white',
  'has-checked:has-focus-visible:outline-1 has-checked:has-focus-visible:outline-dashed has-checked:has-focus-visible:outline-offset-4 has-checked:has-focus-visible:outline-white/50',
])
</script>

<template>
  <div
    v-if="variant === 'cards'"
    :role="role"
    class="grid auto-rows-fr gap-(--app-gutter-inner)"
    :class="hasDescriptions ? 'sm:grid-cols-2' : 'grid-cols-2'"
    data-brief-options
    @keydown="onKeydown"
  >
    <label
      v-for="(option, index) in options"
      :key="option"
      class="relative flex cursor-pointer touch-manipulation flex-col items-start gap-4 rounded-10 text-left select-none transition-[border-color,background-color,color] duration-500 ease-outQuart md:gap-5"
      :class="[hasDescriptions ? 'p-5 md:p-7.5' : 'p-4 md:p-6', outline]"
    >
      <input
        v-model="selected"
        :type="type"
        :name="name"
        :value="option"
        :aria-keyshortcuts="shortcut(index)"
        class="sr-only"
        @change="playPick"
      />

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
    </label>
  </div>

  <div
    v-else
    :role="role"
    class="flex flex-wrap gap-(--app-gutter-inner)"
    data-brief-options
    @keydown="onKeydown"
  >
    <label
      v-for="(option, index) in options"
      :key="option"
      class="relative cursor-pointer touch-manipulation rounded-full px-5 py-3 text-16 font-medium leading-none text-white select-none transition-colors duration-200 ease-outCubic"
      :class="outline"
    >
      <input
        v-model="selected"
        :type="type"
        :name="name"
        :value="option"
        :aria-keyshortcuts="shortcut(index)"
        class="sr-only"
        @change="playPick"
      />

      <span class="trim-both">{{ option }}</span>
    </label>
  </div>
</template>
