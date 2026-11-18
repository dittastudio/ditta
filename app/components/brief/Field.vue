<script lang="ts" setup>
import type { BriefAnswer, BriefLink, BriefQuestion } from '@/utils/brief'

interface Props {
  question: BriefQuestion
  autofocus?: boolean
}

const { question, autofocus = false } = defineProps<Props>()
const model = defineModel<BriefAnswer | undefined>()
const emit = defineEmits<{ picked: [option: string]; submit: [] }>()

const text = computed({
  get: () => (typeof model.value === 'string' ? model.value : ''),
  set: (value: string) => {
    model.value = value
  },
})

const options = computed({
  get: () => model.value as string | string[] | undefined,
  set: (value) => {
    model.value = value
  },
})

const links = computed({
  get: () => model.value as BriefLink[] | undefined,
  set: (value) => {
    model.value = value
  },
})

const single = computed({
  get: () => (typeof model.value === 'string' ? model.value : undefined),
  set: (value) => {
    model.value = value
  },
})
</script>

<template>
  <BriefOptions
    v-if="question.field === 'cards' || question.field === 'chips'"
    v-model="options"
    :options="question.options ?? []"
    :variant="question.field"
    :multiple="question.multiple"
    @picked="emit('picked', $event)"
  />

  <BriefSlider
    v-else-if="question.field === 'slider'"
    v-model="single"
    :options="question.options ?? []"
    :label="question.title"
  />

  <BriefLinks
    v-else-if="question.field === 'links'"
    v-model="links"
    @submit="emit('submit')"
  />

  <BriefTextInput
    v-else
    v-model="text"
    :type="question.field === 'email' || question.field === 'url' ? question.field : 'text'"
    :placeholder="question.placeholder"
    :autocomplete="question.autocomplete"
    :label="question.title"
    :autofocus="autofocus"
    @submit="emit('submit')"
  />
</template>
