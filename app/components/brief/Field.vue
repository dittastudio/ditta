<script lang="ts" setup>
import type { BriefLinkRow, BriefLinkRowErrors, BriefQuestion } from '#shared/utils/brief'
import type { BriefFieldKey } from '#shared/schemas/brief'
import type { Component } from 'vue'
import { briefLinkLimits } from '#shared/schemas/brief'
import IconChatgpt from '@/assets/icons/chatgpt.svg'
import IconClaude from '@/assets/icons/claude.svg'
import IconGoogle from '@/assets/icons/google.svg'
import IconInstagram from '@/assets/icons/instagram.svg'
import IconLinkedin from '@/assets/icons/linkedin.svg'
import IconReferral from '@/assets/icons/referral.svg'
import BriefDot from '@/components/brief/Dot.vue'

interface Props {
  question: BriefQuestion
  labelledby: string
  errors?: string[]
  rowErrors?: BriefLinkRowErrors[]
  focusOnMount?: boolean
}

const { question, labelledby, errors = [], rowErrors = [], focusOnMount = false } = defineProps<Props>()
const model = defineModel<unknown>()
// `touch` once a typed answer has been left, so its errors can start to show (see Question)
const emit = defineEmits<{ submit: []; touch: [] }>()

// Logos for option cards, kept here rather than with the questions in #shared, which the server reads too
const optionIcons: Partial<Record<BriefFieldKey, Partial<Record<string, Component>>>> = {
  source: {
    Google: IconGoogle,
    Instagram: IconInstagram,
    LinkedIn: IconLinkedin,
    ChatGPT: IconChatgpt,
    Claude: IconClaude,
    Referral: IconReferral,
    'Your work': BriefDot,
  },
}

// Shows what Regle reports; never validates anything itself
const errorId = useId()
const a11y = computed(() => ({
  'aria-labelledby': labelledby,
  'aria-describedby': errors.length ? errorId : undefined,
  'aria-invalid': errors.length ? true : undefined,
}))

const as = <T>() =>
  computed({
    get: () => model.value as T,
    set: (value: T) => {
      model.value = value
    },
  })

const text = computed({
  get: () => (typeof model.value === 'string' ? model.value : ''),
  set: (value: string) => {
    model.value = value
  },
})
const options = as<string | string[] | undefined>()
const single = as<string | undefined>()
const links = as<BriefLinkRow[] | undefined>()

const inputmode = { email: 'email', url: 'url' } as const

// Leaving a field you've typed in is when it's checked. Not an empty one, which would only be told off for being
// empty, and not when the whole window loses focus, which isn't leaving the field.
const typed = ['text', 'email', 'url', 'links'].includes(question.field)

function onFocusout() {
  if (typed && document.hasFocus() && hasBriefAnswer(model.value)) emit('touch')
}
</script>

<template>
  <div
    class="flex flex-col gap-(--brief-error-gap) [--brief-error-gap:--spacing(3)]"
    @focusout="onFocusout"
  >
    <BriefOptions
      v-if="question.field === 'cards'"
      v-model="options"
      v-bind="a11y"
      :options="question.options ?? []"
      :descriptions="question.descriptions"
      :icons="optionIcons[question.key]"
      :multiple="question.multiple"
    />

    <BriefSlider
      v-else-if="question.field === 'slider'"
      v-model="single"
      v-bind="a11y"
      :name="question.key"
      :options="question.options ?? []"
      :initial="question.initial"
    />

    <BriefLinks
      v-else-if="question.field === 'links'"
      v-model="links"
      v-bind="a11y"
      :row-errors="rowErrors"
      :placeholders="question.placeholders"
      :note-placeholder="question.notePlaceholder"
      :sharing-nudge="question.sharingNudge"
      :max="briefLinkLimits[question.key as keyof typeof briefLinkLimits]"
      :focus-on-mount="focusOnMount"
      @submit="emit('submit')"
    />

    <BriefTextInput
      v-else
      v-model="text"
      v-bind="a11y"
      :name="question.key"
      :type="question.field === 'email' || question.field === 'url' ? question.field : 'text'"
      :inputmode="question.field === 'email' || question.field === 'url' ? inputmode[question.field] : undefined"
      :placeholder="question.placeholders?.[0] ?? question.placeholder"
      :placeholders="question.placeholders"
      :autocomplete="question.autocomplete ?? 'off'"
      :focus-on-mount="focusOnMount"
      @submit="emit('submit')"
    />

    <BriefFieldError
      :id="errorId"
      :errors="errors"
    />
  </div>
</template>
