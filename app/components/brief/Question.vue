<script lang="ts" setup>
import type { BriefFieldKey } from '#shared/schemas/brief'
import type { BriefStep } from '#shared/utils/brief'
import { briefStepSchemas } from '#shared/schemas/brief'

interface Props {
  step: BriefStep
}

const { step } = defineProps<Props>()
const emit = defineEmits<{ submit: [] }>()

const brief = useBriefStore()
const frame = useBriefFrame()

// This screen's schema: its question plus its follow-ups. A field isn't judged while it's first being typed into:
// its errors show once it's been left with something in it (see Field), or after Next. From then on they follow
// along as it changes.
const { r$ } = useRegleSchema(toRef(brief, 'answers'), briefStepSchemas[step.key], { autoDirty: false })
const touch = (key: BriefFieldKey) => r$.$fields[key]?.$touch()

const titleId = useId()
const title = computed(() => personaliseBrief(step.title, brief.answers))
const followUps = computed(() => visibleFollowUps(step, brief.answers))

const emailSuggestion = computed(() =>
  step.field === 'email' && brief.answers.email ? suggestBriefEmail(brief.answers.email) : null,
)

type ErrorNode =
  | string[]
  | { $self?: string[]; $each?: ({ url?: ErrorNode; note?: ErrorNode } | undefined)[] }
  | undefined

const errorTree = computed(() => r$.$errors as Partial<Record<BriefFieldKey, ErrorNode>>)
const ownErrors = (node: ErrorNode): string[] => (Array.isArray(node) ? node : (node?.$self ?? []))
const errorsFor = (key: BriefFieldKey) => ownErrors(errorTree.value[key])
const rowErrorsFor = (key: BriefFieldKey) => {
  const node = errorTree.value[key]
  return Array.isArray(node)
    ? []
    : (node?.$each?.map((row) => ({ url: ownErrors(row?.url), note: ownErrors(row?.note) })) ?? [])
}

const answer = (key: BriefFieldKey) => brief.answers[key]
const setAnswer = (key: BriefFieldKey, value: unknown) => brief.setAnswer(key, value as never)

async function validate() {
  const { valid } = await r$.$validate()
  return valid
}

defineExpose({ validate })
</script>

<template>
  <section
    :aria-labelledby="titleId"
    data-brief-question
    class="flex flex-col gap-10 md:gap-15"
  >
    <div class="flex flex-col gap-5 md:gap-7.5">
      <h1
        :id="titleId"
        data-brief-heading
        class="text-24 leading-tight text-balance trim-both md:text-28"
      >
        {{ title }}
      </h1>

      <p
        v-if="step.hint"
        class="text-16 opacity-60 text-pretty trim-both md:text-20"
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
      @update:model-value="setAnswer(step.key, $event)"
      @submit="emit('submit')"
      @touch="touch(step.key)"
    />

    <Transition name="brief-reveal">
      <p
        v-if="emailSuggestion"
        class="-mt-2 text-16 opacity-60 md:-mt-9"
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
    </Transition>

    <input
      v-if="step.field === 'email'"
      v-model="brief.honeypot"
      type="text"
      name="fax_number_confirm"
      autocomplete="off"
      tabindex="-1"
      aria-hidden="true"
      class="pointer-events-none fixed -left-full size-px opacity-0"
    />

    <p
      v-if="step.field === 'email'"
      class="-mt-2 text-16 opacity-60 md:-mt-9"
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
      name="brief-reveal"
      tag="div"
      class="flex flex-col gap-6 empty:hidden md:gap-15"
      @enter="(el: Element) => frame(el.querySelector('[data-brief-target]'))"
    >
      <div
        v-for="followUp in followUps"
        :key="followUp.key"
        data-brief-question
        class="flex flex-col gap-4 md:gap-7.5"
      >
        <p
          :id="`${titleId}-${followUp.key}`"
          data-brief-heading
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
          @touch="touch(followUp.key)"
        />
      </div>
    </TransitionGroup>
  </section>
</template>
