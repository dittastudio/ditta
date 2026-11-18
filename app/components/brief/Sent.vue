<script lang="ts" setup>
const brief = useBriefStore()

const email = computed(() => (typeof brief.answers.email === 'string' ? brief.answers.email.trim() : ''))
const firstName = computed(() => briefFirstName(brief.answers))
const payload = computed(() => JSON.stringify(visibleBriefAnswers(brief.answers), null, 2))
</script>

<template>
  <section
    v-if="brief.status === 'sent'"
    class="flex flex-col gap-6"
  >
    <h1 class="text-28 font-medium leading-tight text-balance sm:text-40">Check your inbox to finish</h1>

    <p class="text-18">
      We've sent a link to <strong class="font-medium">{{ email }}</strong>. Click it to send your brief to us.
    </p>

    <p class="rounded-10 bg-white p-4 text-14">
      <strong class="font-medium">Prototype:</strong> nothing has been sent. In the real flow this waits for the email
      link to be clicked.
    </p>

    <details class="text-14">
      <summary class="cursor-pointer font-medium">What would be submitted</summary>

      <pre class="mt-2 overflow-x-auto rounded-10 bg-white p-4 text-12 font-mono">{{ payload }}</pre>
    </details>
  </section>

  <section
    v-else
    class="flex flex-col gap-6"
  >
    <h1 class="text-28 font-medium leading-tight text-balance sm:text-40">
      Thanks{{ firstName ? `, ${firstName}` : '' }}. Your brief is on its way.
    </h1>

    <p class="text-18">We'll reply within two working days to book a short call.</p>
  </section>
</template>
