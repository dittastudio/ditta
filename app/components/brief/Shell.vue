<script lang="ts" setup>
const brief = useBriefStore()
const lenis = useLenis()

const isDraft = computed(() => brief.status === 'draft')
const position = computed(() => brief.stepIndex + 1)
const minutesLeft = computed(() => Math.max(1, Math.ceil(((brief.total - position.value) * 15) / 60)))

const error = ref<string | null>(null)
const shaking = ref(false)

const primaryLabel = computed(() => {
  if (brief.status === 'sent') return 'Simulate confirm'
  if (brief.status === 'confirmed') return 'Start over'
  if (brief.isSummary) return 'Send brief'
  if (brief.editingFromSummary) return 'Back to summary'
  if (brief.step?.field === 'email') return 'Review'
  if (brief.step && !brief.step.required && !isBriefAnswered(brief.answers[brief.step.key])) return 'Skip'

  return 'Next'
})

function primary() {
  if (brief.status === 'sent') return brief.setStatus('confirmed')
  if (brief.status === 'confirmed') return brief.reset()
  if (brief.isSummary) return brief.setStatus('sent')

  const step = brief.step
  const message = step ? briefStepError(step, brief.answers) : null

  if (message) {
    error.value = message
    shaking.value = false
    requestAnimationFrame(() => (shaking.value = true))
    return
  }

  brief.next()
}

function back() {
  if (brief.status === 'sent') return brief.setStatus('draft')
  brief.back()
}

// Auto-advance only moves on when the step is actually complete
function advance() {
  if (brief.step && !briefStepError(brief.step, brief.answers)) brief.next()
}

watch(
  () => brief.answers,
  () => (error.value = null),
)

watch(
  () => [brief.stepIndex, brief.status],
  () => {
    error.value = null
    lenis.value?.scrollTo(0, { immediate: true })
  },
)

const screenKey = computed(() => (isDraft.value ? `step-${brief.stepIndex}` : brief.status))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-grey text-black">
    <div class="wrapper flex flex-1 flex-col pt-(--dock-height)">
      <div class="mx-auto flex w-full max-w-160 flex-1 flex-col">
        <header
          v-if="isDraft"
          class="flex flex-col gap-2 pt-6"
        >
          <div class="flex justify-between text-14">
            <span>{{ position }} of {{ brief.total }}</span>
            <span class="opacity-60">~{{ minutesLeft }} min</span>
          </div>

          <div
            class="h-1 overflow-hidden rounded-full bg-black/10"
            role="progressbar"
            :aria-valuenow="position"
            aria-valuemin="1"
            :aria-valuemax="brief.total"
          >
            <div
              class="h-full origin-left rounded-full bg-black transition-transform duration-300 ease-outCubic"
              :style="{ transform: `scaleX(${position / brief.total})` }"
            />
          </div>
        </header>

        <main class="flex flex-1 flex-col py-8">
          <Transition
            :name="brief.direction === 1 ? 'brief-forward' : 'brief-back'"
            mode="out-in"
          >
            <div
              :key="screenKey"
              class="my-auto w-full"
            >
              <BriefSent v-if="!isDraft" />

              <BriefSummary v-else-if="brief.isSummary" />

              <BriefQuestion
                v-else-if="brief.step"
                :step="brief.step"
                @advance="advance"
                @submit="primary"
              />
            </div>
          </Transition>
        </main>
      </div>
    </div>

    <footer class="sticky bottom-0 bg-grey pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
      <div class="wrapper">
        <div class="mx-auto flex w-full max-w-160 items-center gap-3 border-t border-black/10 pt-4">
          <button
            v-if="brief.status !== 'confirmed'"
            type="button"
            class="rounded-full px-5 py-3 text-16 font-medium ring-1 ring-black/20 disabled:opacity-30"
            :disabled="isDraft && brief.stepIndex === 0"
            @click="back"
          >
            Back
          </button>

          <p
            class="flex-1 text-center text-14"
            aria-live="polite"
          >
            {{ error }}
          </p>

          <button
            type="button"
            class="rounded-full bg-black px-6 py-3 text-16 font-medium text-grey"
            :class="{ 'shake-once': shaking }"
            @click="primary"
            @animationend="shaking = false"
          >
            {{ primaryLabel }}
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>
