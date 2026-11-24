<script lang="ts" setup>
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { gsap } from 'gsap'
import { defineSound } from '@web-kits/audio'
import type { BriefField } from '#shared/utils/brief'
import type { BriefSubmitInput } from '#shared/schemas/brief'
import { briefAnswersSchema, briefStepSchemas } from '#shared/schemas/brief'
import { confetti, pageEnter, save } from '@@/.web-kits/core'

const brief = useBriefStore()
const root = useTemplateRef('root')
const content = useTemplateRef('content')
const navComponent = useTemplateRef('nav')
const nav = computed(() => navComponent.value?.el)
const question = useTemplateRef('question')

// Moving on is heard: a save for each Next, a page turning for a Skip, confetti for reaching the review
const { play } = useAudio()
const advanceSounds: Partial<Record<string, ReturnType<typeof defineSound>>> = {
  Next: defineSound(save),
  Skip: defineSound(pageEnter),
  Review: defineSound(confetti),
}

// Where the nav's top sits when it's pinned to the bottom of the viewport. Layout only, so it holds mid-glide.
function pinnedNavTop() {
  if (!nav.value) return
  return window.innerHeight - Number.parseFloat(getComputedStyle(nav.value).bottom) - nav.value.offsetHeight
}

// The content's top in page coordinates, so it survives scrolling
const contentTop = () => (content.value ? content.value.getBoundingClientRect().top + window.scrollY : 0)

// Where the nav's top sits on screen for a screen at a given page position and height: just under it, or pinned,
// whichever is higher. Worked out from the content, since the nav itself may be mid-glide.
function navTopFor(top: number, height: number, scroll = window.scrollY) {
  const pinned = pinnedNavTop()
  if (!content.value || pinned === undefined) return

  const gap = Number.parseFloat(getComputedStyle(content.value.parentElement!).rowGap) || 0
  return Math.min(top + height + gap - scroll, pinned)
}

// Fields are framed against the pinned nav, not wherever it sits now: scrolled down past a short step, the nav
// is high up the screen, but by the time the brief has scrolled the field into view it's pinned to the bottom.
const { frame, alignTop, frameFirstError, engagement, disengage } = useBriefScroll(pinnedNavTop)

// When the screen above it changes height (a new step, a follow-up, an error), the nav glides to its new place
// instead of jumping there. The layout moves at once; the nav is offset back to where it was on screen and eased
// home. The resize lands after layout but before paint, so the jump is never drawn.
// The content itself doesn't need to: it's fading in anyway.
// The content's last size and page position. The position is kept because a new height moves the content's top
// too (the brief is centred on the screen), and by the time the resize is reported the old top is gone.
let last: { width: number; height: number; top: number } | undefined
// A new step jumps the scroll as it mounts, before its resize is reported. The nav was last drawn against the scroll
// from before that jump, so that's where its glide starts from. Taken as the old step starts to leave, while the page
// is still as it was drawn: once it's gone, scroll anchoring and a text field focusing as it mounts can both move the
// scroll before the enter hook runs.
let scrollBeforeSwap: number | undefined
const onBeforeLeave = () => (scrollBeforeSwap = window.scrollY)

const onAfterEnter = () => {
  scrollBeforeSwap = undefined
  releaseKeyboard()
}

function stopGliding() {
  if (nav.value) gsap.killTweensOf(nav.value)
  if (nav.value) gsap.set(nav.value, { clearProps: 'transform' })
}

useResizeObserver(content, ([entry]) => {
  const { width, height } = entry!.contentRect
  const previous = last
  last = { width, height, top: contentTop() }
  const scroll = scrollBeforeSwap
  scrollBeforeSwap = undefined

  // A new width is the window resizing, which should follow the window straight away
  if (!previous || !nav.value || width !== previous.width) {
    stopGliding()
    return
  }

  const from = navTopFor(previous.top, previous.height, scroll)
  const to = navTopFor(last.top, height)
  if (from === undefined || to === undefined) return

  glide(nav.value, 'y', from - to, {
    // Short moves land with the step's own 250ms; longer ones take a little more, never outlasting the 600ms scroll
    duration: (distance) => gsap.utils.clamp(0.25, 0.45, 0.2 + distance / 1500),
    // power3.out is --ease-outCubic, the step transition's curve, so both settle the same way
    ease: 'power3.out',
  })
})

// The content can move without resizing, which the observer never hears of: a window only getting taller or shorter
// re-centres it, and on first load it's measured before everything around it has settled. So its position is taken
// again on resize and at the start of every press or key, just before anything done to the brief can resize it.
const refreshTop = () => {
  if (last) last.top = contentTop()
}

useEventListener('resize', refreshTop)

onBeforeUnmount(stopGliding)

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
  if (!nextStep || !keyboardFields.has(nextStep.field)) return
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

  const sound = advanceSounds[navComponent.value?.primaryLabel ?? '']
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
  <!-- A faint dashed focus ring for keyboard users. Not on text fields, which turn olive, or on headings focused in code. -->
  <div
    class="flex min-h-svh flex-col justify-center bg-black text-white [&_:focus-visible:not(input,[tabindex='-1'])]:outline-1 [&_:focus-visible:not(input,[tabindex='-1'])]:outline-dashed [&_:focus-visible:not(input,[tabindex='-1'])]:outline-offset-4 [&_:focus-visible:not(input,[tabindex='-1'])]:outline-white/50 [&_[tabindex='-1']]:outline-none"
    @pointerdown.capture="refreshTop"
    @keydown.capture="refreshTop"
  >
    <div
      class="wrapper pt-[calc(var(--dock-height)+--spacing(20))] pb-30 md:pt-[calc(var(--dock-height)+--spacing(40))] md:pb-60"
    >
      <div
        ref="root"
        class="mx-auto w-full max-w-174"
      >
        <!-- Only as tall as the step, so the nav sits right under it. Still sticky for steps taller than the screen -->
        <div class="flex w-full flex-col gap-10 md:gap-15">
          <div ref="content">
            <Transition
              :name="brief.direction === 1 ? 'brief-forward' : 'brief-back'"
              mode="out-in"
              @before-leave="onBeforeLeave"
              @enter="onEnter"
              @after-enter="onAfterEnter"
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
          </div>

          <BriefNav
            ref="nav"
            v-model:shaking="shaking"
            :error="error"
            @primary="primary"
            @cleared="onCleared"
          />

          <!-- Holds the keyboard open between steps on touch (see holdKeyboard). 16px text so iOS doesn't zoom to it. -->
          <input
            ref="keyboardProxy"
            type="text"
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
    </div>
  </div>
</template>
