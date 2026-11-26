<script lang="ts" setup>
import { useDocumentVisibility, useEventListener, useIntervalFn } from '@vueuse/core'
import { useRegleSchema } from '@regle/schemas'
import type { BriefResendInput } from '#shared/schemas/brief'
import { briefResendSchema } from '#shared/schemas/brief'

// Check your inbox: the brief is sent but waits on its email link. This tab watches for the link being clicked,
// here or on another device, and "Not received your email?" sends it again, to a corrected address if need be. The
// nav's main button is Resend (see Shell).
const emit = defineEmits<{ error: [message: string] }>()

const brief = useBriefStore()

const POLL_MS = 4000

// "Not received your email?" opens the tips and the address, which can be fixed before resending
const open = ref(false)
const form = reactive<BriefResendInput>({ email: brief.sentEmail })
const { r$ } = useRegleSchema(form, briefResendSchema)
const emailId = useId()
const errorId = useId()
const emailErrors = computed(() => (r$.email.$dirty ? r$.email.$errors : []))

// Read out once a resend has gone
const announcement = ref('')

// The brief has gone from the server (unconfirmed for two weeks, or this browser's cookie was cleared): back to the
// review, with the answers still here, to send it again
function gone() {
  brief.briefId = null
  brief.setStatus('draft')
  emit('error', 'That link has run out. Send your brief again.')
}

const isGone = (failure: unknown) => (failure as { statusCode?: number }).statusCode === 404

async function check() {
  if (!brief.briefId || brief.sending) return
  try {
    const { status } = await $fetch(`/api/brief/${brief.briefId}/status`)
    if (status === 'confirmed') brief.markConfirmed()
  } catch (failure) {
    if (isGone(failure)) gone()
  }
}

// While the tab is showing, and straight away on coming back to it from the email
const visibility = useDocumentVisibility()
const { pause, resume } = useIntervalFn(check, POLL_MS)
watch(
  visibility,
  (now) => {
    if (now === 'visible') {
      void check()
      resume()
    } else pause()
  },
  { immediate: true },
)
useEventListener(window, 'focus', check)

async function resend() {
  if (brief.sending || !brief.briefId) return

  if (open.value) {
    const { valid } = await r$.$validate()
    if (!valid) return document.getElementById(emailId)?.focus()
  }

  // Resend counts the wait down and can't be pressed meanwhile (see Nav), but Enter in the address field still lands here
  if (brief.lastSentAt + BRIEF_RESEND_COOLDOWN_MS > Date.now()) return

  brief.sending = true
  try {
    const sent = await $fetch(`/api/brief/${brief.briefId}/resend`, {
      method: 'POST',
      body: { email: open.value ? form.email : brief.sentEmail } satisfies BriefResendInput,
    })
    if (sent.status === 'confirmed') return brief.markConfirmed()

    brief.sentEmail = sent.email
    brief.lastSentAt = Date.now()
    form.email = sent.email
    r$.$reset()
    announcement.value = `Sent again to ${sent.email}`
  } catch (failure) {
    if (isGone(failure)) return gone()
    const { data } = failure as { data?: { message?: string } }
    emit('error', data?.message || 'That didn’t send. Try again.')
  } finally {
    brief.sending = false
  }
}

defineExpose({ resend })
</script>

<template>
  <section class="flex flex-col gap-10 md:gap-15">
    <h1 class="text-24 leading-tight text-balance trim-both md:text-28">Check your inbox to finish</h1>

    <p class="text-18 opacity-60 md:text-20">
      We've sent a link to <strong class="font-medium text-white">{{ brief.sentEmail }}</strong>. Click it to send your
      brief to us.
    </p>

    <button
      v-if="!open"
      type="button"
      class="self-start text-16 underline decoration-white/40 underline-offset-4 transition-[text-decoration-color] duration-hover ease-outCubic only-hover:hover:decoration-white"
      :aria-expanded="open"
      @click="open = true"
    >
      Not received your email?
    </button>

    <div
      v-else
      class="flex flex-col gap-6"
    >
      <p class="text-16 opacity-60">
        It can take a minute, and sometimes lands in spam or promotions. If the address is wrong, fix it here and press
        Resend.
      </p>

      <div class="flex flex-col gap-(--brief-error-gap)">
        <label
          :for="emailId"
          class="sr-only"
        >
          Your email
        </label>

        <BriefTextInput
          :id="emailId"
          v-model="form.email"
          focus-on-mount
          type="email"
          name="email"
          autocomplete="email"
          inputmode="email"
          :aria-invalid="emailErrors.length ? true : undefined"
          :aria-describedby="emailErrors.length ? errorId : undefined"
          @submit="resend"
          @blur="r$.email.$touch()"
        />

        <BriefFieldError
          :id="errorId"
          :errors="emailErrors"
        />
      </div>
    </div>

    <p
      class="sr-only"
      role="status"
    >
      {{ announcement }}
    </p>
  </section>
</template>
