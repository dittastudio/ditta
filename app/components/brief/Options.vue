<script lang="ts" setup>
import type { Component } from 'vue'
import { defineSound } from '@web-kits/audio'
import { checkbox, radio } from '@@/.web-kits/core'

interface Props {
  options: readonly string[]
  descriptions?: Partial<Record<string, string>>
  // A logo before an option card's title, keyed by option
  icons?: Partial<Record<string, Component>>
  multiple?: boolean
}

const { options, descriptions = {}, icons = {}, multiple = false } = defineProps<Props>()
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
// Titles without a logo stand as tall as one, so they line up with their neighbours
const hasIcons = computed(() => options.some((option) => icons[option]))

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

// 1–9 pick the first nine options (see useBriefKeys), announced through aria-keyshortcuts and shown as keycaps when
// the shortcuts setting is on. Each key is part of the option's content, which Option draws twice, so the fill turns it
// black with the text. The label is what useBriefKeys marks data-pressed, so its key presses down with the real one.
const shortcut = (index: number) => (index < 9 ? String(index + 1) : undefined)
</script>

<template>
  <div
    :role="role"
    class="grid auto-rows-fr gap-(--app-gutter-inner)"
    :class="hasDescriptions ? 'sm:grid-cols-2' : 'grid-cols-2'"
    data-brief-options
    @keydown="onKeydown"
  >
    <BriefOption
      v-for="(option, index) in options"
      :key="option"
      v-model="selected"
      :type="type"
      :name="name"
      :value="option"
      :shortcut="shortcut(index)"
      :invalid="!!$attrs['aria-invalid']"
      class="flex rounded-10"
      :content-class="[
        'flex w-full flex-col items-start gap-4 md:gap-5',
        hasDescriptions ? 'p-5 md:p-7.5' : 'p-4 md:p-6',
      ]"
      @pick="playPick"
    >
      <UiKbd
        v-if="shortcut(index)"
        class="absolute top-3 right-3 md:top-4 md:right-4"
        >{{ shortcut(index) }}</UiKbd
      >

      <span
        class="flex items-center gap-2.5 font-medium leading-tight md:gap-3 md:text-20"
        :class="[hasDescriptions ? 'text-18' : 'text-16', hasIcons && 'min-h-5 md:min-h-6']"
      >
        <component
          :is="icons[option]"
          v-if="icons[option]"
          aria-hidden="true"
          class="size-5 shrink-0 md:size-6"
        />
        <span class="trim-both">{{ option }}</span>
      </span>

      <span
        v-if="descriptions[option]"
        class="text-14 leading-snug text-pretty opacity-60 md:text-16"
      >
        {{ descriptions[option] }}
      </span>
    </BriefOption>
  </div>
</template>
