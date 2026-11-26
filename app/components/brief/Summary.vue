<script lang="ts" setup>
const brief = useBriefStore()

// Every visible question in order, follow-ups straight after their parent
const rows = computed(() =>
  briefSteps.flatMap((step, stepIndex) =>
    [step, ...visibleFollowUps(step, brief.answers)].map((question) => ({
      key: question.key,
      stepIndex,
      title: personaliseBrief(question.title, brief.answers),
      answer: formatBriefAnswer(brief.answers[question.key]),
      required: question === step ? isBriefStepRequired(step) : true,
    })),
  ),
)
</script>

<template>
  <section class="flex flex-col gap-15 md:gap-24">
    <p class="text-center text-16 opacity-60 text-pretty trim-both md:text-20">
      Check everything's right before you send it
    </p>

    <!-- Turnstile shares this wrapper rather than taking a gap of its own: its element is never empty (a hidden
         iframe runs the check) but has no height unless Cloudflare asks for a click -->
    <div>
      <ol class="flex flex-col divide-y divide-white/25 border-y border-white/25">
        <li
          v-for="(row, index) in rows"
          :key="row.key"
          class="flex items-start gap-4 py-5"
        >
          <span class="w-6 shrink-0 text-14 leading-snug text-beige">{{ index + 1 }}</span>

          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <p class="text-14 leading-snug text-beige md:text-16">
              {{ row.title }}
            </p>

            <p
              v-if="row.answer"
              class="text-18 leading-snug break-words md:text-20"
            >
              {{ row.answer }}
            </p>

            <p
              v-else
              class="text-18 leading-snug italic opacity-40 md:text-20"
            >
              {{ row.required ? 'Not answered' : 'Skipped' }}
            </p>
          </div>

          <button
            type="button"
            :aria-label="`Edit: ${row.title}`"
            class="pokeable shrink-0 rounded-full bg-white/10 px-4 py-2.5 text-14 font-medium leading-none transition-opacity duration-hover ease-outCubic disabled:opacity-40 only-hover:hover:bg-white/20"
            :disabled="brief.sending"
            @click="brief.goTo(row.stepIndex, true)"
          >
            Edit
          </button>
        </li>
      </ol>

      <BriefTurnstile
        v-model="brief.turnstileToken"
        v-model:failed="brief.turnstileFailed"
      />
    </div>
  </section>
</template>
