<script lang="ts" setup>
import type { BriefDraft } from '#shared/utils/brief'
import { briefAnswersSchema } from '#shared/schemas/brief'

// Dev only (see $production in nuxt.config.ts): the brief, filled in, to run through without answering every step.
// Replaces whatever brief this browser has saved (settings stay), then opens /brief at the review.
// - /_dev/brief?step=4 opens question 4 instead, with every answer still in place
// - Send it, then /_dev/brief/confirm follows its confirm link from the dev outbox (no Resend key needed)
// The answers are checked against the schema first: when an option is renamed, this page lists what no longer fits
// rather than dropping you on whichever step it breaks.
definePageMeta({ tagline: false, theme: 'dark' })
useSeoMeta({ robots: 'noindex, nofollow' })

const sample: BriefDraft = {
  services: ['Web Design', 'Other'],
  servicesOther: 'A brand refresh to go with it',
  business: 'Independent coffee roaster in Hackney',
  objectives: ['Sell online', 'Explain what we do'],
  productCount: '10–50',
  timing: '3 months',
  references: [
    { url: 'https://example.com/shop', note: 'Love how simple the checkout is' },
    { url: 'https://example.org', note: '' },
  ],
  contentStage: 'Partially ready',
  budget: '£10k–£20k',
  name: 'Sam Taylor',
  website: 'example.net',
  source: 'Referral',
  email: 'delivered@resend.dev',
}

const parsed = briefAnswersSchema.safeParse(sample)
const issues = parsed.success
  ? []
  : parsed.error.issues.map((issue) => `${issue.path.join('.') || 'answers'}: ${issue.message}`)

const route = useRoute()

onMounted(() => {
  if (issues.length) return

  const brief = useBriefStore()
  brief.reset()
  Object.assign(brief.answers, structuredClone(sample))
  // Past the server's 20 second check on a brief sent too soon after starting
  brief.startedAt = Date.now() - 60_000
  brief.start()

  const step = typeof route.query.step === 'string' ? route.query.step : 'review'
  navigateTo({ path: '/brief', query: { step } }, { replace: true })
})
</script>

<template>
  <div class="flex min-h-svh flex-col bg-black text-white">
    <div class="wrapper flex flex-1 flex-col justify-center gap-4 py-(--app-vertical-rhythm)">
      <template v-if="issues.length">
        <p class="text-body">The sample brief no longer fits the schema:</p>

        <ul class="flex flex-col gap-1 font-mono text-14 opacity-60">
          <li
            v-for="issue in issues"
            :key="issue"
          >
            {{ issue }}
          </li>
        </ul>
      </template>

      <p
        v-else
        class="text-body opacity-60"
      >
        Filling in the brief…
      </p>
    </div>
  </div>
</template>
