<script lang="ts" setup>
import type { BriefLinkRow, BriefQuestion } from '@/utils/brief'

interface Props {
  question: BriefQuestion
  labelledby: string
  errors?: string[]
  rowErrors?: string[][]
  focusOnMount?: boolean
}

const { question, labelledby, errors = [], rowErrors = [], focusOnMount = false } = defineProps<Props>()
const model = defineModel<unknown>()
const emit = defineEmits<{ submit: [] }>()

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
</script>

<template>
  <div
    data-brief-target
    class="flex flex-col gap-3"
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
      :options="question.options ?? []"
    />

    <BriefLinks
      v-else-if="question.field === 'links'"
      v-model="links"
      v-bind="a11y"
      :row-errors="rowErrors"
      @submit="emit('submit')"
    />

    <BriefTextInput
      v-else
      v-model="text"
      v-bind="a11y"
      :type="question.field === 'email' || question.field === 'url' ? question.field : 'text'"
      :inputmode="question.field === 'email' || question.field === 'url' ? inputmode[question.field] : undefined"
      :placeholder="question.placeholder"
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
