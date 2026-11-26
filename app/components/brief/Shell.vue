<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'
import { defineSound } from '@web-kits/audio'
import type { BriefSubmitInput } from '#shared/schemas/brief'
import { briefAnswersSchema } from '#shared/schemas/brief'
import { confetti, drawerOpen, hover, pageEnter, save } from '@@/.web-kits/core'
import IconReturn from '@/assets/icons/return.svg'

// The brief's answers and progress, opened at the step in the URL
const brief = useBriefStore()
followBriefUrl(useRoute().query.step)

// Which screen is showing, keyed so each step (and each restart) mounts fresh
const root = useTemplateRef('root')
const isIntro = computed(() => brief.status === 'intro')
const isDraft = computed(() => brief.status === 'draft')
const restarts = ref(0)
const screenKey = computed(() => (isDraft.value ? `step-${brief.stepIndex}-${restarts.value}` : brief.status))

// Start grows into the nav, and the nav shrinks back into Start
const { play, playHover } = useAudio()
const soundStartHover = defineSound(hover)
const soundStart = defineSound(drawerOpen)
const nav = useTemplateRef('nav')
const navBar = useTemplateRef('navBar')
const startButton = useTemplateRef('startButton')
const morph = useBriefMorph({
  start: () => startButton.value,
  nav: () => nav.value?.$el as HTMLElement | undefined,
  bar: () => navBar.value,
})
const { morphing } = morph

// A step that changes height glides to its new position
const glide = useBriefGlide()

// The message and shake shown in the nav when something's wrong, cleared as soon as an answer changes
const error = ref<string | null>(null)
const shaking = ref(false)

function shake() {
  shaking.value = false
  requestAnimationFrame(() => (shaking.value = true))
}

function fail(message: string) {
  error.value = message
  shake()
}

watch(
  () => brief.answers,
  () => (error.value = null),
  { deep: true },
)

// And when the screen changes, so one screen's message doesn't follow a send onto the next. Straight away, rather than
// before the next render, so a message given with the move (back to the review from Check your inbox) is kept: set
// it after the move.
watch(screenKey, () => (error.value = null), { flush: 'sync' })

// Puts focus on the first answer that needs fixing, so its error is read out
async function focusFirstError() {
  await nextTick()
  const invalid = root.value?.querySelector<HTMLElement>('[aria-invalid="true"]')
  const control = invalid?.matches('input, button') ? invalid : invalid?.querySelector<HTMLElement>('input, button')
  control?.focus()
}

// The sound for moving on: a save, a page turn for a skip, confetti into review
const advanceSounds = {
  next: defineSound(save),
  skip: defineSound(pageEnter),
  review: defineSound(confetti),
  summary: undefined,
}

// Checks the whole brief, then posts it with the Turnstile token
const turnstileReady = !!useRuntimeConfig().public.turnstileSiteKey || import.meta.dev

async function send() {
  if (brief.sending) return
  // Back from Check your inbox, Send counts down the wait between sends (see Nav), but Enter still lands here
  if (brief.briefId && brief.lastSentAt + BRIEF_RESEND_COOLDOWN_MS > Date.now()) return

  const result = briefAnswersSchema.safeParse(brief.answers)
  if (!result.success) {
    const keys = result.error.issues.map((issue) => issue.path[0])
    const index = briefSteps.findIndex(
      (step) => keys.includes(step.key) || visibleFollowUps(step, brief.answers).some((f) => keys.includes(f.key)),
    )
    if (index >= 0) brief.goTo(index, true)
    fail('One answer needs another look')
    return
  }

  if (!turnstileReady) return fail('The brief isn’t set up to send yet')
  if (!brief.turnstileToken && brief.turnstileFailed) {
    return fail('We couldn’t check you’re not a robot. Reload the page and try again.')
  }
  if (!brief.turnstileToken) return fail('Still checking you’re not a robot. Try again in a moment.')

  brief.sending = true
  try {
    const sent = await $fetch('/api/brief', {
      method: 'POST',
      body: {
        id: brief.briefId ?? undefined,
        answers: result.data,
        elapsed: brief.startedAt ? Date.now() - brief.startedAt : 0,
        honeypot: brief.honeypot || undefined,
        turnstileToken: brief.turnstileToken,
      } satisfies BriefSubmitInput,
    })
    brief.markPending(sent.id, sent.email)
  } catch (failure) {
    brief.turnstileToken = ''
    const { data } = failure as { data?: { message?: string } }
    fail(data?.message || 'Your brief didn’t send. Try again.')
  } finally {
    brief.sending = false
  }
}

// The main button (Start, Next, Send, Resend, Start over), also on Enter
const question = useTemplateRef('question')
const inbox = useTemplateRef('inbox')

async function primary() {
  if (brief.status === 'intro') {
    play(soundStart)
    return brief.start()
  }
  if (brief.status === 'sent') return inbox.value?.resend()
  if (brief.status === 'confirmed') {
    await morph.fade()
    return brief.reset()
  }
  if (brief.isSummary) return send()
  if (question.value && !(await question.value.validate())) {
    shake()
    return focusFirstError()
  }

  const sound = advanceSounds[brief.advance]
  if (sound) play(sound)
  brief.next()
}

// Keyboard shortcuts for the main button and Back
useBriefKeys(root, { primary, back: () => nav.value?.back() })

// Start again wipes the draft, so the first screen mounts fresh
function onCleared() {
  error.value = null
  restarts.value++
}

// As each screen comes in, its question takes focus unless a field already has it
function focusHeading(el: Element) {
  if (el.contains(document.activeElement)) return
  const heading = el.querySelector('h1')
  if (!heading) return
  heading.tabIndex = -1
  heading.focus()
}

// A new screen starts from its top, so a step taller than the screen isn't met halfway down. Instant, as the swap
// is already the movement.
const lenis = useLenis()

function toTop() {
  const top = root.value?.getBoundingClientRect().top ?? 0
  if (top < 0) lenis.value?.scrollTo(window.scrollY + top, { immediate: true })
}

function onEnter(el: Element) {
  toTop()
  focusHeading(el)
  morph.enter(el)
}
</script>

<template>
  <div
    ref="root"
    :data-shortcuts="brief.shortcuts"
    class="flex min-h-svh flex-col [overflow-anchor:none] bg-black text-white [&_:focus-visible:not(input,[tabindex='-1'])]:outline-1 [&_:focus-visible:not(input,[tabindex='-1'])]:outline-dashed [&_:focus-visible:not(input,[tabindex='-1'])]:outline-offset-4 [&_:focus-visible:not(input,[tabindex='-1'])]:outline-white/50 [&_[tabindex='-1']]:outline-none"
  >
    <div class="wrapper flex flex-1 flex-col justify-center py-(--brief-nav-space)">
      <div class="mx-auto w-full max-w-174">
        <Transition
          :name="brief.direction === 1 ? 'brief-forward' : 'brief-back'"
          mode="out-in"
          @enter="onEnter"
        >
          <div
            :key="screenKey"
            :ref="glide.observe"
            class="flex w-full flex-col gap-8 md:gap-12"
          >
            <template v-if="isIntro">
              <div class="flex flex-col items-center gap-6 text-center md:gap-10">
                <h1 class="text-40 leading-tight trim-both md:text-64">Create your brief</h1>
                <p class="max-w-120 text-16 leading-snug text-pretty opacity-60 md:text-20">
                  A few quick questions about you and your project.<br />
                  Only takes a few minutes.
                </p>
              </div>

              <button
                ref="startButton"
                type="button"
                class="self-center flex items-center h-(--brief-nav-button) rounded-20 corner-shape-squircle bg-white/15 pr-8 pl-10 text-14 font-medium md:text-16 text-white transition-[background-color] duration-hover ease-outCubic only-hover:hover:bg-white/25"
                :class="{ invisible: morphing }"
                aria-keyshortcuts="Enter"
                @pointerenter="playHover($event, soundStartHover)"
                @click="primary"
              >
                Start
                <IconReturn
                  class="ml-2 size-4 fill-none"
                  aria-hidden="true"
                />
              </button>
            </template>

            <template v-else>
              <h1
                v-if="isDraft && brief.isSummary"
                class="self-center text-40 leading-tight trim-both md:text-64"
              >
                Review your brief
              </h1>

              <BriefInbox
                v-if="brief.status === 'sent'"
                ref="inbox"
                @error="fail"
              />

              <BriefThanks
                v-else-if="!isDraft"
                :name="brief.sentName"
              />

              <BriefSummary v-else-if="brief.isSummary" />

              <BriefQuestion
                v-else-if="brief.step"
                ref="question"
                :step="brief.step"
                @submit="primary"
              />
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <div
      ref="navBar"
      class="wrapper pointer-events-none sticky bottom-(--brief-nav-inset) z-10 -mt-(--brief-nav-height) mb-(--brief-nav-inset) h-(--brief-nav-height)"
      :class="{ invisible: isIntro && !morphing }"
      :inert="isIntro"
    >
      <BriefNav
        ref="nav"
        v-model:shaking="shaking"
        class="pointer-events-auto mx-auto max-w-174"
        :error="error"
        @primary="primary"
        @cleared="onCleared"
      />
    </div>
  </div>
</template>
