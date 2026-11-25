<script lang="ts" setup>
import type { BriefLinkRow, BriefLinkRowErrors, BriefQuestion } from '#shared/utils/brief'
import { briefLinkLimits } from '#shared/schemas/brief'

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

// Coming back to a field that's already filled in leaves it be, rather than dropping the caret into an answer that's
// done. Focus goes to the question instead, so Enter carries on. Decided as it mounts, not as it's typed into.
const focusFirst = focusOnMount && !hasBriefAnswer(model.value)
</script>

<template>
  <div
    data-brief-target
    class="flex flex-col gap-(--brief-error-gap) [--brief-error-gap:--spacing(3)]"
    @focusout="onFocusout"
  >
    <BriefOptions
      v-if="question.field === 'cards' || question.field === 'chips'"
      v-model="options"
      v-bind="a11y"
      :options="question.options ?? []"
      :descriptions="question.descriptions"
      :variant="question.field"
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
      :focus-on-mount="focusFirst"
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
      :focus-on-mount="focusFirst"
      @submit="emit('submit')"
    />

    <BriefFieldError
      :id="errorId"
      :errors="errors"
    />
  </div>
</template>
