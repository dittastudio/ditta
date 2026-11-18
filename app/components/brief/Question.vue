<script lang="ts" setup>
import type { BriefFieldKey } from '#shared/schemas/brief'
import type { BriefStep } from '@/utils/brief'
import { briefStepSchemas } from '#shared/schemas/brief'

interface Props {
  step: BriefStep
}

const { step } = defineProps<Props>()
const emit = defineEmits<{ advance: []; submit: [] }>()

const brief = useBriefStore()

// This screen's schema: its question plus its follow-ups. Errors show once a field is dirty or after Next.
const { r$ } = useRegleSchema(toRef(brief, 'answers'), briefStepSchemas[step.key])

const titleId = useId()
const title = computed(() => personaliseBrief(step.title, brief.answers))
const followUps = computed(() => visibleFollowUps(step, brief.answers))

const emailSuggestion = computed(() =>
  step.field === 'email' && brief.answers.email ? suggestBriefEmail(brief.answers.email) : null,
)

type ErrorNode = string[] | { $self?: string[]; $each?: ({ url?: ErrorNode } | undefined)[] } | undefined

const errorTree = computed(() => r$.$errors as Partial<Record<BriefFieldKey, ErrorNode>>)
const ownErrors = (node: ErrorNode): string[] => (Array.isArray(node) ? node : (node?.$self ?? []))
const errorsFor = (key: BriefFieldKey) => ownErrors(errorTree.value[key])
const rowErrorsFor = (key: BriefFieldKey) => {
  const node = errorTree.value[key]
  return Array.isArray(node) ? [] : (node?.$each?.map((row) => ownErrors(row?.url)) ?? [])
}

const answer = (key: BriefFieldKey) => brief.answers[key]
const setAnswer = (key: BriefFieldKey, value: unknown) => brief.setAnswer(key, value as never)

async function validate() {
  const { valid } = await r$.$validate()
  return valid
}

// A single-select pick moves on by itself, unless it opens a follow-up that still needs answering
let timer: ReturnType<typeof setTimeout> | undefined

function onPicked() {
  clearTimeout(timer)
  if (followUps.value.length) return

  timer = setTimeout(async () => {
    if (await validate()) emit('advance')
  }, 380)
}

onUnmounted(() => clearTimeout(timer))

defineExpose({ validate })
</script>

<template>
  <section
    :aria-labelledby="titleId"
    class="flex flex-col gap-10 md:gap-15"
  >
    <div class="flex flex-col gap-5 md:gap-7.5">
      <h1
        :id="titleId"
        class="text-24 leading-tight text-balance trim-both md:text-28"
      >
        {{ title }}
      </h1>

      <p
        v-if="step.hint"
        class="text-16 text-beige text-pretty trim-both md:text-20"
      >
        {{ step.hint }}
      </p>
    </div>

    <BriefField
      :question="step"
      :labelledby="titleId"
      :model-value="answer(step.key)"
      :errors="errorsFor(step.key)"
      :row-errors="rowErrorsFor(step.key)"
      focus-on-mount
      shortcuts
      @update:model-value="setAnswer(step.key, $event)"
      @picked="onPicked"
      @submit="emit('submit')"
    />

    <p
      v-if="emailSuggestion"
      class="-mt-6 text-16 text-beige md:-mt-9"
    >
      Did you mean
      <button
        type="button"
        class="font-medium underline underline-offset-4"
        @click="brief.setAnswer('email', emailSuggestion)"
      >
        {{ emailSuggestion }}</button
      >?
    </p>

    <p
      v-if="step.field === 'email'"
      class="-mt-6 text-16 text-beige md:-mt-9"
    >
      We'll only use this to reply about your project. See our
      <NuxtLink
        to="/privacy-policy"
        target="_blank"
        class="underline underline-offset-4 only-hover:hover:text-white"
        >privacy policy</NuxtLink
      >.
    </p>

    <TransitionGroup
      name="fade"
      tag="div"
      class="flex flex-col gap-10 empty:hidden md:gap-15"
    >
      <div
        v-for="followUp in followUps"
        :key="followUp.key"
        class="flex flex-col gap-5"
      >
        <p
          :id="`${titleId}-${followUp.key}`"
          class="text-20 leading-tight trim-both"
        >
          {{ followUp.title }}
        </p>

        <BriefField
          :question="followUp"
          :labelledby="`${titleId}-${followUp.key}`"
          :model-value="answer(followUp.key)"
          :errors="errorsFor(followUp.key)"
          focus-on-mount
          @update:model-value="setAnswer(followUp.key, $event)"
          @submit="emit('submit')"
        />
      </div>
    </TransitionGroup>
  </section>
</template>
