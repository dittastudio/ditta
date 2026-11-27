<script lang="ts" setup>
import type { BriefLinkState } from '#shared/schemas/brief'
import IconReturn from '@/assets/icons/return.svg'

// Where a brief's email link lands (M4 in docs/plans/brief-builder-milestones.md). Opening the link only looks it up:
// email scanners open links before people do, so the brief is sent by the button, never by the visit.
useSeoMeta({
  title: 'Send your brief',
  robots: 'noindex, nofollow',
})

const appStore = useAppStore()
const brief = useBriefStore()
const route = useRoute()

onMounted(() => {
  appStore.setTheme('dark')
})

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

type PageState = BriefLinkState | { state: 'loading' } | { state: 'renewed'; email: string }

const page = ref<PageState>({ state: 'loading' })
// Confirmed by this visit, rather than earlier, which gets the thank-you rather than the date it arrived
const justConfirmed = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)

const receivedOn = computed(() =>
  page.value.state === 'confirmed'
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        page.value.confirmedAt,
      )
    : '',
)

// The tab still showing Check your inbox in this browser moves on to the thanks too
function settle(state: BriefLinkState) {
  page.value = state
  if (state.state === 'confirmed' && brief.briefId === state.id) brief.markConfirmed()
}

const messageOf = (failure: unknown, fallback: string) =>
  (failure as { data?: { message?: string } }).data?.message || fallback

onMounted(async () => {
  if (!token.value) return (page.value = { state: 'invalid' })
  try {
    settle(await $fetch<BriefLinkState>('/api/brief/confirm', { query: { token: token.value } }))
  } catch {
    page.value = { state: 'invalid' }
  }
})

async function confirm() {
  if (busy.value) return
  busy.value = true
  error.value = null
  try {
    const state = await $fetch<BriefLinkState>('/api/brief/confirm', {
      method: 'POST',
      body: { token: token.value },
    })
    justConfirmed.value = state.state === 'confirmed'
    // The funnel's last step (the rest is in useBriefTracking)
    if (justConfirmed.value) useTrackEvent('Brief: Confirmed')
    settle(state)
  } catch (failure) {
    error.value = messageOf(failure, 'That didn’t send. Try again.')
  } finally {
    busy.value = false
  }
}

async function renew() {
  if (busy.value) return
  busy.value = true
  error.value = null
  try {
    const result = await $fetch<BriefLinkState | { state: 'renewed'; email: string }>('/api/brief/renew', {
      method: 'POST',
      body: { token: token.value },
    })
    if (result.state === 'renewed') page.value = result
    else settle(result)
  } catch (failure) {
    error.value = messageOf(failure, 'That didn’t send. Try again.')
  } finally {
    busy.value = false
  }
}

const buttonClass =
  'self-center flex items-center h-(--brief-nav-button) rounded-20 corner-shape-squircle bg-white/15 pr-8 pl-10 text-14 font-medium md:text-16 text-white transition-[background-color] duration-hover ease-outCubic only-hover:hover:bg-white/25 disabled:opacity-50'
</script>

<template>
  <div class="flex min-h-svh flex-col bg-black text-white">
    <div class="wrapper flex flex-1 flex-col justify-center py-(--brief-nav-space)">
      <div
        class="mx-auto flex w-full max-w-174 flex-col items-center gap-8 text-center md:gap-10"
        aria-live="polite"
      >
        <BriefThanks
          v-if="page.state === 'confirmed' && justConfirmed"
          :name="page.name"
        />

        <template v-else-if="page.state === 'confirmed'">
          <h1 class="text-40 leading-tight text-balance trim-both md:text-64">Your brief has reached us</h1>
          <p class="max-w-120 text-16 leading-snug text-pretty opacity-60 md:text-20">
            It arrived on {{ receivedOn }}. We'll reply within two working days of then.
          </p>
        </template>

        <template v-else-if="page.state === 'pending'">
          <h1 class="text-40 leading-tight text-balance trim-both md:text-64">Send your brief?</h1>
          <p class="max-w-120 text-16 leading-snug text-pretty opacity-60 md:text-20">
            {{ page.name }}'s brief for {{ page.business }}. Once you confirm, it comes straight to us, and we'll email
            you a copy.
          </p>
          <button
            type="button"
            :class="buttonClass"
            :disabled="busy"
            @click="confirm"
          >
            {{ busy ? 'Sending…' : 'Confirm and send' }}
            <IconReturn
              class="ml-2 size-4 fill-none"
              aria-hidden="true"
            />
          </button>
        </template>

        <template v-else-if="page.state === 'expired'">
          <h1 class="text-40 leading-tight text-balance trim-both md:text-64">This link has expired</h1>
          <p class="max-w-120 text-16 leading-snug text-pretty opacity-60 md:text-20">
            Links work for 72 hours. Your brief is still here, so we can send you a new one.
          </p>
          <button
            type="button"
            :class="buttonClass"
            :disabled="busy"
            @click="renew"
          >
            {{ busy ? 'Sending…' : 'Send me a new link' }}
          </button>
        </template>

        <template v-else-if="page.state === 'renewed'">
          <h1 class="text-40 leading-tight text-balance trim-both md:text-64">Check your inbox</h1>
          <p class="max-w-120 text-16 leading-snug text-pretty opacity-60 md:text-20">
            We've sent a new link to <strong class="font-medium text-white">{{ page.email }}</strong>.
          </p>
        </template>

        <template v-else-if="page.state === 'invalid'">
          <h1 class="text-40 leading-tight text-balance trim-both md:text-64">This link doesn't work</h1>
          <p class="max-w-120 text-16 leading-snug text-pretty opacity-60 md:text-20">
            If we've emailed you more than once, use the link in the newest email. Otherwise you can
            <NuxtLink
              to="/brief"
              class="text-white underline decoration-white/40 underline-offset-4"
            >
              start a new brief</NuxtLink
            >.
          </p>
        </template>

        <p
          v-if="error"
          class="text-16 text-coral"
          role="alert"
        >
          {{ error }}
        </p>
      </div>
    </div>
  </div>
</template>
