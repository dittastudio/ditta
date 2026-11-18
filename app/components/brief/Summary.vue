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
      required: question === step ? step.required : true,
    })),
  ),
)
</script>

<template>
  <section class="flex flex-col gap-6">
    <h1 class="text-28 font-medium leading-tight text-balance sm:text-40">
      Check your information is correct before sending
    </h1>

    <ol class="flex flex-col divide-y divide-black/10">
      <li
        v-for="(row, index) in rows"
        :key="row.key"
        class="flex items-start gap-3 py-3"
      >
        <span class="w-5 shrink-0 text-14 font-mono opacity-50">{{ index + 1 }}</span>

        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <p class="text-14 opacity-60">
            {{ row.title }}
          </p>

          <p
            v-if="row.answer"
            class="text-16 font-medium break-words"
          >
            {{ row.answer }}
          </p>

          <p
            v-else
            class="text-16 italic opacity-50"
          >
            {{ row.required ? 'Not answered' : 'Skipped' }}
          </p>
        </div>

        <button
          type="button"
          class="shrink-0 rounded-full bg-white px-3 py-1.5 text-12 font-medium only-hover:hover:bg-putty"
          @click="brief.goTo(row.stepIndex, true)"
        >
          Edit
        </button>
      </li>
    </ol>
  </section>
</template>
