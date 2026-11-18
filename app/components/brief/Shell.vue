<script lang="ts" setup>
import { briefAnswersSchema } from '#shared/schemas/brief'

const brief = useBriefStore()
const appStore = useAppStore()
const lenis = useLenis()
const root = useTemplateRef('root')
const question = useTemplateRef('question')

const isDraft = computed(() => brief.status === 'draft')
const position = computed(() => brief.stepIndex + 1)
const progress = computed(() => (brief.isSummary ? 1 : brief.stepIndex / brief.total))

const error = ref<string | null>(null)
const shaking = ref(false)

const primaryLabel = computed(() => {
  if (brief.status === 'sent') return 'Simulate confirm'
  if (brief.status === 'confirmed') return 'Start over'
  if (brief.isSummary) return 'Send brief'
  if (brief.editingFromSummary) return 'Back to summary'
  if (brief.step?.field === 'email') return 'Review'
  if (brief.step && !isBriefStepRequired(brief.step) && !hasBriefAnswer(brief.answers[brief.step.key])) return 'Skip'

  return 'Next'
})

function shake() {
  shaking.value = false
  requestAnimationFrame(() => (shaking.value = true))
}

// The whole brief is checked against the same schema the server will use. If anything slipped through, go to it.
function send() {
  const result = briefAnswersSchema.safeParse(brief.answers)
  if (result.success) return brief.setStatus('sent')

  const keys = result.error.issues.map((issue) => issue.path[0])
  const index = briefSteps.findIndex(
    (step) => keys.includes(step.key) || visibleFollowUps(step, brief.answers).some((f) => keys.includes(f.key)),
  )

  error.value = 'One answer needs another look'
  shake()
  if (index >= 0) brief.goTo(index, true)
}

async function primary() {
  if (brief.status === 'sent') return brief.setStatus('confirmed')
  if (brief.status === 'confirmed') return brief.reset()
  if (brief.isSummary) return send()

  if (question.value && !(await question.value.validate())) return shake()

  brief.next()
}

function back() {
  if (brief.status === 'sent') return brief.setStatus('draft')
  brief.back()
}

// Only scroll when the top of the form has gone out of view, so short screens don't jump
watch(
  () => [brief.stepIndex, brief.status],
  () => {
    const top = root.value?.getBoundingClientRect().top ?? 0
    if (top < 0) lenis.value?.scrollTo(root.value!, { offset: -appStore.getDockHeight, immediate: true })
  },
)

watch(
  () => brief.answers,
  () => (error.value = null),
  { deep: true },
)

const screenKey = computed(() => (isDraft.value ? `step-${brief.stepIndex}` : brief.status))
</script>

<template>
  <div class="bg-black text-white">
    <div
      class="wrapper pt-[calc(var(--dock-height)+--spacing(20))] pb-30 md:pt-[calc(var(--dock-height)+--spacing(40))] md:pb-60"
    >
      <div
        ref="root"
        class="mx-auto flex w-full max-w-174 flex-col items-center gap-12 md:gap-25"
      >
        <p class="text-40 leading-tight trim-both md:text-64">Create your brief</p>

        <div class="flex w-full flex-col gap-10 md:gap-15">
          <Transition
            :name="brief.direction === 1 ? 'brief-forward' : 'brief-back'"
            mode="out-in"
          >
            <div
              :key="screenKey"
              class="w-full"
            >
              <BriefSent v-if="!isDraft" />

              <BriefSummary v-else-if="brief.isSummary" />

              <BriefQuestion
                v-else-if="brief.step"
                ref="question"
                :step="brief.step"
                @advance="brief.next()"
                @submit="primary"
              />
            </div>
          </Transition>

          <nav
            aria-label="Brief steps"
            class="sticky bottom-4 z-1 flex flex-wrap items-center justify-between gap-x-5 gap-y-4 rounded-10 bg-offblack p-2.5 md:static"
          >
            <div
              v-if="isDraft"
              class="flex w-full flex-col gap-2.5 px-1 pt-1 md:w-60 md:px-0 md:pt-0 md:pl-1"
            >
              <p class="text-14 leading-none trim-both">
                {{ brief.isSummary ? 'Review' : `${position} of ${brief.total}` }}
              </p>

              <div
                class="relative h-0.5 bg-putty"
                role="progressbar"
                :aria-valuenow="Math.min(position, brief.total)"
                aria-valuemin="1"
                :aria-valuemax="brief.total"
              >
                <div
                  class="absolute inset-y-0 left-0 w-full origin-left bg-coral transition-transform duration-500 ease-outQuart"
                  :style="{ transform: `scaleX(${Math.max(progress, 1 / brief.total)})` }"
                />
              </div>
            </div>

            <p
              v-else
              class="pl-1 text-14"
            >
              {{ brief.status === 'sent' ? 'Prototype' : 'Brief sent' }}
            </p>

            <p
              v-if="error"
              class="order-last w-full pl-1 text-14 text-coral sm:order-none sm:w-auto"
              aria-live="polite"
            >
              {{ error }}
            </p>

            <div class="flex w-full items-center justify-between gap-2.5 md:ml-auto md:w-auto md:justify-end md:gap-5">
              <button
                v-if="brief.status !== 'confirmed'"
                type="button"
                class="rounded-full disabled:pointer-events-none disabled:opacity-30"
                :disabled="isDraft && brief.stepIndex === 0"
                @click="back"
              >
                <UiButton
                  text="Previous"
                  theme="dark"
                  size="medium"
                />
              </button>

              <button
                type="button"
                class="rounded-full"
                :class="{ 'shake-once': shaking }"
                @click="primary"
                @animationend="shaking = false"
              >
                <UiButton
                  :text="primaryLabel"
                  theme="white"
                  size="medium"
                />
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>
