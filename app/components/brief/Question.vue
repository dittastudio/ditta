<script lang="ts" setup>
import type { BriefAnswer, BriefStep } from '@/utils/brief'

interface Props {
  step: BriefStep
}

const { step } = defineProps<Props>()
const emit = defineEmits<{ advance: []; submit: [] }>()

const brief = useBriefStore()

const answer = (key: string) => brief.answers[key]
const setAnswer = (key: string, value: BriefAnswer | undefined) => brief.setAnswer(key, value ?? '')

const followUps = computed(() => visibleFollowUps(step, brief.answers))
const title = computed(() => personaliseBrief(step.title, brief.answers))
const emailSuggestion = computed(() => {
  const value = answer('email')
  return step.field === 'email' && typeof value === 'string' ? suggestBriefEmail(value) : null
})

// A single-select pick moves on by itself, unless it opens a follow-up that still needs answering
let timer: ReturnType<typeof setTimeout> | undefined

function onPicked(option: string) {
  clearTimeout(timer)
  if (step.followUps?.some((followUp) => followUp.showsWhen === option)) return

  timer = setTimeout(() => emit('advance'), 380)
}

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <section
    :aria-labelledby="`brief-${step.key}`"
    class="flex flex-col gap-6"
  >
    <div class="flex flex-col gap-2">
      <h1
        :id="`brief-${step.key}`"
        class="text-28 font-medium leading-tight text-balance sm:text-40"
      >
        {{ title }}
      </h1>

      <p
        v-if="step.hint"
        class="text-16 italic opacity-60"
      >
        {{ step.hint }}
      </p>
    </div>

    <BriefField
      :question="step"
      :model-value="answer(step.key)"
      autofocus
      @update:model-value="setAnswer(step.key, $event)"
      @picked="onPicked"
      @submit="emit('submit')"
    />

    <p
      v-if="emailSuggestion"
      class="-mt-3 text-14"
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
      class="-mt-3 text-14 opacity-60"
    >
      We'll only use this to reply about your project.
    </p>

    <TransitionGroup
      name="fade"
      tag="div"
      class="flex flex-col gap-6 empty:hidden"
    >
      <div
        v-for="followUp in followUps"
        :key="followUp.key"
        class="flex flex-col gap-3"
      >
        <p class="text-18 font-medium">
          {{ followUp.title }}
        </p>

        <BriefField
          :question="followUp"
          :model-value="answer(followUp.key)"
          autofocus
          @update:model-value="setAnswer(followUp.key, $event)"
          @submit="emit('submit')"
        />
      </div>
    </TransitionGroup>
  </section>
</template>
