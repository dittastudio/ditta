<script lang="ts" setup>
import { defineSound } from '@web-kits/audio'
import type { BriefField } from '#shared/utils/brief'
import type { BriefSubmitInput } from '#shared/schemas/brief'
import { briefAnswersSchema, briefStepSchemas } from '#shared/schemas/brief'
import { confetti, pageEnter, save } from '@@/.web-kits/core'

const brief = useBriefStore()
const root = useTemplateRef('root')
const nav = useTemplateRef('nav')
const navBar = useTemplateRef('navBar')
const question = useTemplateRef('question')

// Moving on is heard: a save for each Next, a page turning for a Skip, confetti for reaching the review
const { play } = useAudio()
const advanceSounds: Partial<Record<string, ReturnType<typeof defineSound>>> = {
  Next: defineSound(save),
  Skip: defineSound(pageEnter),
  Review: defineSound(confetti),
}

// Where the nav's top sits when it's pinned to the bottom of the viewport. Fields are framed against this rather than
// wherever the nav is now: scrolled down to the footer, the nav has moved up with the end of the brief, but once a
// field has been scrolled into view it's pinned again.
function pinnedNavTop() {
  if (!navBar.value) return
  return window.innerHeight - Number.parseFloat(getComputedStyle(navBar.value).bottom) - navBar.value.offsetHeight
}

const { frame, alignTop, frameFirstError, engagement, disengage } = useBriefScroll(pinnedNavTop, () => root.value)

const isDraft = computed(() => brief.status === 'draft')

const error = ref<string | null>(null)
const shaking = ref(false)
// Read out by screen readers only: what's wrong when Next is blocked
const announcement = ref('')

function shake() {
  shaking.value = false
  requestAnimationFrame(() => (shaking.value = true))
}

const turnstileReady = !!useRuntimeConfig().public.turnstileSiteKey || import.meta.dev

// The whole brief is checked against the same schema the server will use. If anything slipped through, go to it.
async function send() {
  if (brief.sending) return

  const result = briefAnswersSchema.safeParse(brief.answers)
  if (!result.success) {
    const keys = result.error.issues.map((issue) => issue.path[0])
    const index = briefSteps.findIndex(
      (step) => keys.includes(step.key) || visibleFollowUps(step, brief.answers).some((f) => keys.includes(f.key)),
    )

    error.value = 'One answer needs another look'
    shake()
    if (index >= 0) brief.goTo(index, true)
    return
  }

  // Without a site key there's no widget, so no token is ever coming
  if (!turnstileReady) {
    error.value = 'The brief isn’t set up to send yet'
    return shake()
  }

  if (!brief.turnstileToken && brief.turnstileFailed) {
    error.value = 'We couldn’t check you’re not a robot. Reload the page and try again.'
    return shake()
  }

  // Managed Turnstile usually has its token before anyone reaches Send. If it's still deciding, say so.
  if (!brief.turnstileToken) {
    error.value = 'Still checking you’re not a robot. Try again in a moment.'
    return shake()
  }

  brief.sending = true
  try {
    await $fetch('/api/brief', {
      method: 'POST',
      body: {
        // The parsed answers: follow-ups that aren't shown are dropped, and links have their https:// added
        answers: result.data,
        elapsed: brief.startedAt ? Date.now() - brief.startedAt : 0,
        honeypot: brief.honeypot || undefined,
        turnstileToken: brief.turnstileToken,
      } satisfies BriefSubmitInput,
    })
    brief.markSent()
  } catch (failure) {
    // The token's been used either way, so the widget fetches another for the retry
    brief.turnstileToken = ''
    // The reason is read from the response body: over HTTP/2 there's no status text to carry it
    const { data } = failure as { data?: { message?: string } }
    error.value = data?.message || 'Your brief didn’t send. Try again.'
    shake()
  } finally {
    brief.sending = false
  }
}

// iOS only opens the keyboard for a focus made inside the tap itself, and the next step's field focuses as it mounts,
// after the old step has gone. So on touch, a Next headed for a text field focuses this stand-in during the tap,
// which brings the keyboard up, and the new field takes focus from it as it mounts. Moving focus between fields keeps
// the keyboard open.
const keyboardProxy = useTemplateRef('keyboardProxy')
const keyboardFields = new Set<BriefField>(['text', 'email', 'url', 'links'])

function holdKeyboard() {
  if (!isTouch() || !brief.step || brief.editingFromSummary) return

  const nextStep = briefSteps[brief.stepIndex + 1]
  // A field that's already filled in doesn't take focus (see Field), so there's no keyboard to hold open for it
  if (!nextStep || !keyboardFields.has(nextStep.field) || hasBriefAnswer(brief.answers[nextStep.key])) return
  // The same check Next is about to make, but synchronous, so it can still count as part of the tap
  if (!briefStepSchemas[brief.step.key].safeParse(brief.answers).success) return

  keyboardProxy.value?.focus({ preventScroll: true })
}

// Should the new field not have taken over, the keyboard closes rather than typing into nothing
function releaseKeyboard() {
  if (keyboardProxy.value && document.activeElement === keyboardProxy.value) keyboardProxy.value.blur()
}

async function primary() {
  if (brief.status === 'sent') return brief.setStatus('confirmed')
  if (brief.status === 'confirmed') return brief.reset()
  if (brief.isSummary) return send()

  holdKeyboard()

  if (question.value && !(await question.value.validate())) {
    releaseKeyboard()
    shake()
    await nextTick()
    await flagFirstError()
    return frameFirstError(root.value)
  }

  const sound = advanceSounds[nav.value?.primaryLabel ?? '']
  if (sound) play(sound)
  brief.next()
}

useBriefKeys(root, primary)

// A blocked Next says why, and on a keyboard puts focus on the answer to fix. Not on touch: focusing a text field
// there opens the keyboard, and the error is right under the field anyway. Cleared first, so the same message
// twice in a row is still read out.
async function flagFirstError() {
  const invalid = root.value?.querySelector<HTMLElement>('[aria-invalid="true"]')
  if (!invalid) return

  const describedBy = invalid.getAttribute('aria-describedby')
  announcement.value = ''
  await nextTick()
  announcement.value =
    (describedBy && document.getElementById(describedBy)?.textContent?.trim()) || 'Answer to continue'

  if (isTouch()) return
  const control = invalid.matches('input, button') ? invalid : invalid.querySelector<HTMLElement>('input, button')
  control?.focus({ preventScroll: true })
}

// Bumped on restart so the first screen is rebuilt clean, even when restarting from it, rather than flagging the
// answers that just disappeared as missing
const restarts = ref(0)
// Set by a clear, so focusing the first screen's first card isn't taken for a first touch
let cleared = false

function onCleared() {
  error.value = null
  cleared = true
  restarts.value++
  disengage()
}

// Focus moves onto each new screen rather than staying on the button that got there, which would leave a screen
// reader silent and send the next Tab out to the footer. A text field has already taken focus as it mounted;
// otherwise the heading does, so the question is the first thing read out.
function focusScreen(el: Element) {
  if (el.contains(document.activeElement)) return
  const heading = el.querySelector<HTMLElement>('h1')
  if (!heading) return

  heading.tabIndex = -1
  heading.focus({ preventScroll: true })
}

// Each new screen centres its field once it has mounted, so it measures the real thing. Doesn't run on first render.
// Centred even when already in view: a new step should land in the same place every time. It jumps there rather than
// gliding: the old screen has gone and the new one hasn't faded in yet, so there's nothing on it to see move. A glide
// would only show the page under it, and the footer coming up past a step shorter than the one it replaced.
function onEnter(el: Element) {
  // After a clear, the first card takes focus in place of the confirm that just went. It does so while `cleared` is
  // still set, so that focus isn't taken for a first touch, and the centring below does the scrolling.
  if (cleared) {
    el.querySelector<HTMLElement>('[data-brief-target] input')?.focus({ preventScroll: true })
    cleared = false
  } else {
    focusScreen(el)
  }

  const target = el.querySelector('[data-brief-target]')
  if (target) frame(target, { centre: true, instant: true })
  else alignTop(el)
}

watch(
  () => brief.answers,
  () => {
    error.value = null
    announcement.value = ''
  },
  { deep: true },
)

const screenKey = computed(() => (isDraft.value ? `step-${brief.stepIndex}-${restarts.value}` : brief.status))
</script>

<template>
  <!-- A faint dashed focus ring for keyboard users. Not on text fields, which turn olive, or on headings focused in code.
       The nav is in here too, so the brief's keys (see useBriefKeys) still work with focus on its buttons. -->
  <div
    ref="root"
    class="flex min-h-svh flex-col bg-black text-white [&_:focus-visible:not(input,[tabindex='-1'])]:outline-1 [&_:focus-visible:not(input,[tabindex='-1'])]:outline-dashed [&_:focus-visible:not(input,[tabindex='-1'])]:outline-offset-4 [&_:focus-visible:not(input,[tabindex='-1'])]:outline-white/50 [&_[tabindex='-1']]:outline-none"
  >
    <div
      class="wrapper flex flex-1 flex-col justify-center pt-[calc(var(--dock-height)+--spacing(20))] pb-10 md:pt-[calc(var(--dock-height)+--spacing(40))] md:pb-15"
    >
      <div class="mx-auto w-full max-w-174">
        <Transition
          :name="brief.direction === 1 ? 'brief-forward' : 'brief-back'"
          mode="out-in"
          @enter="onEnter"
          @after-enter="releaseKeyboard"
        >
          <div
            :key="screenKey"
            class="flex w-full flex-col gap-8 md:gap-25"
            @pointerdown="engagement.onPointerdown"
            @click="engagement.onClick"
            @focusin="!cleared && engagement.onFocusin($event)"
          >
            <!-- The brief's title only bookends it: on the first step and on review -->
            <h1
              v-if="isDraft && brief.isSummary"
              class="self-center text-40 leading-tight trim-both md:text-64"
            >
              Review your brief
            </h1>

            <p
              v-else-if="isDraft && brief.stepIndex === 0"
              class="self-center text-40 leading-tight trim-both md:text-64"
            >
              Create your brief
            </p>

            <BriefSent v-if="!isDraft" />

            <BriefSummary v-else-if="brief.isSummary" />

            <BriefQuestion
              v-else-if="brief.step"
              ref="question"
              :step="brief.step"
              @submit="primary"
            />
          </div>
        </Transition>

        <!-- Holds the keyboard open between steps on touch (see holdKeyboard). 16px text so iOS doesn't zoom to it. -->
        <input
          ref="keyboardProxy"
          name="keyboard_proxy"
          type="text"
          autocomplete="off"
          enterkeyhint="next"
          class="pointer-events-none fixed top-0 left-0 size-px text-16 opacity-0"
          tabindex="-1"
          aria-hidden="true"
        />

        <p
          class="sr-only"
          role="status"
        >
          {{ announcement }}
        </p>
      </div>
    </div>

    <!-- Pinned to the bottom of the screen, apart from the steps above it, as far from it as the Dock is from the top. Last in the brief, so it rides up with the
         brief's end rather than covering the footer. -->
    <div
      ref="navBar"
      class="wrapper pointer-events-none sticky bottom-7.5 z-10 mb-7.5"
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
