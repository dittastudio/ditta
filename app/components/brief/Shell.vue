<script lang="ts" setup>
import {
  onClickOutside,
  onKeyStroke,
  useEventListener,
  usePreferredReducedMotion,
  useResizeObserver,
} from '@vueuse/core'
import { gsap } from 'gsap'
import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'
import IconReset from '@/assets/icons/reset.svg'
import { briefAnswersSchema } from '#shared/schemas/brief'

const brief = useBriefStore()
const root = useTemplateRef('root')
const content = useTemplateRef('content')
const nav = useTemplateRef('nav')
const question = useTemplateRef('question')
const resetButton = useTemplateRef('resetButton')
const cancelButton = useTemplateRef('cancelButton')

// Where the nav's top sits when it's pinned to the bottom of the viewport. Layout only, so it holds mid-glide.
function pinnedNavTop() {
  if (!nav.value) return
  return window.innerHeight - Number.parseFloat(getComputedStyle(nav.value).bottom) - nav.value.offsetHeight
}

// The content's top in page coordinates, so it survives scrolling
const contentTop = () => (content.value ? content.value.getBoundingClientRect().top + window.scrollY : 0)

// Where the nav's top sits on screen for a screen at a given page position and height: just under it, or pinned,
// whichever is higher. Worked out from the content, since the nav itself may be mid-glide.
function navTopFor(top: number, height: number) {
  const pinned = pinnedNavTop()
  if (!content.value || pinned === undefined) return

  const gap = Number.parseFloat(getComputedStyle(content.value.parentElement!).rowGap) || 0
  return Math.min(top + height + gap - window.scrollY, pinned)
}

// Fields are framed against the pinned nav, not wherever it sits now: scrolled down past a short step, the nav
// is high up the screen, but by the time the brief has scrolled the field into view it's pinned to the bottom.
const { frame, alignTop, frameFirstError, engagement, disengage } = useBriefScroll(pinnedNavTop)

// When the screen above it changes height (a new step, a follow-up, an error), the nav glides to its new place
// instead of jumping there. The layout moves at once; the nav is offset back to where it was on screen and eased
// home. The resize lands after layout but before paint, so the jump is never drawn.
// The content itself doesn't need to: it's fading in anyway.
const reducedMotion = usePreferredReducedMotion()
let glide: gsap.core.Tween | undefined
// The content's last size and page position. The position is kept because a new height moves the content's top
// too (the brief is centred on the screen), and by the time the resize is reported the old top is gone.
let last: { width: number; height: number; top: number } | undefined

function stopGliding() {
  glide?.kill()
  glide = undefined
  if (nav.value) gsap.set(nav.value, { clearProps: 'transform' })
}

useResizeObserver(content, ([entry]) => {
  const { width, height } = entry!.contentRect
  const previous = last
  last = { width, height, top: contentTop() }

  // A new width is the window resizing, which should follow the window straight away
  if (!previous || !nav.value || width !== previous.width || reducedMotion.value === 'reduce') {
    stopGliding()
    return
  }

  const from = navTopFor(previous.top, previous.height)
  const to = navTopFor(last.top, height)
  if (from === undefined || to === undefined) return

  // Mid-glide, carry on from wherever it has got to on screen
  const offset = from + Number(gsap.getProperty(nav.value, 'y')) - to
  if (Math.abs(offset) < 1) return

  // Short moves land with the step's own 250ms; longer ones take a little more, never outlasting the 600ms scroll
  const duration = gsap.utils.clamp(0.25, 0.45, 0.2 + Math.abs(offset) / 1500)

  glide = gsap.fromTo(
    nav.value,
    { y: offset },
    // power3.out is --ease-outCubic, the step transition's curve, so both settle the same way
    { y: 0, duration, ease: 'power3.out', overwrite: true, clearProps: 'transform' },
  )
})

// A window only getting taller or shorter re-centres the brief without resizing its content
useEventListener('resize', () => {
  if (last) last.top = contentTop()
})

onUnmounted(stopGliding)

const isDraft = computed(() => brief.status === 'draft')
const position = computed(() => brief.stepIndex + 1)
const progress = computed(() => (brief.isSummary ? 1 : brief.stepIndex / brief.total))

const error = ref<string | null>(null)
const shaking = ref(false)
// Read out by screen readers only: what's wrong when Next is blocked
const announcement = ref('')

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

  if (question.value && !(await question.value.validate())) {
    shake()
    await nextTick()
    await flagFirstError()
    return frameFirstError(root.value)
  }

  brief.next()
}

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

// Start again wipes the whole draft, so the nav turns into a "Clear everything?" confirm first. Cancel takes focus,
// so a reflexive Enter is safe. Esc, a click outside the nav, or answering anything all count as carrying on.
const hasStarted = computed(() => brief.stepIndex > 0 || Object.keys(brief.answers).length > 0)
const confirmingClear = ref(false)
// True while the icon spins its full turn after clearing, so the button stays put long enough to be seen doing it.
// The nav's steps come back with a fresh button, so `spinning` starts the turn a frame after it mounts at rest.
const clearing = ref(false)
const spinning = ref(false)
// Bumped on restart so the first screen is rebuilt clean, even when restarting from it, rather than flagging the
// answers that just disappeared as missing
const restarts = ref(0)
// Set by a clear, so focusing the first screen's first card isn't taken for a first touch
let cleared = false
let clearingTimer: ReturnType<typeof setTimeout> | undefined

async function askToClear() {
  confirmingClear.value = true
  await nextTick()
  cancelButton.value?.focus()
}

async function cancelClear({ refocus = true } = {}) {
  if (!confirmingClear.value) return
  confirmingClear.value = false
  if (!refocus) return
  await nextTick()
  resetButton.value?.focus()
}

function clear() {
  confirmingClear.value = false
  error.value = null
  clearing.value = true
  spinning.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => (spinning.value = true)))
  clearTimeout(clearingTimer)
  clearingTimer = setTimeout(() => (clearing.value = false), 750)

  cleared = true
  brief.reset()
  restarts.value++
  disengage()
}

onKeyStroke('Escape', () => cancelClear())
onClickOutside(nav, () => cancelClear({ refocus: false }))
onUnmounted(() => clearTimeout(clearingTimer))

function back() {
  if (brief.status === 'sent') return brief.setStatus('draft')
  brief.back()
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
// Centred even when already in view: a new step should land in the same place every time.
function onEnter(el: Element) {
  // After a clear, the first card takes focus in place of the confirm that just went. It does so while `cleared` is
  // still set, so that focus isn't taken for a first touch, and the centring below does the scrolling.
  if (cleared) {
    el.querySelector<HTMLElement>('[data-brief-target] button')?.focus({ preventScroll: true })
    cleared = false
  } else {
    focusScreen(el)
  }

  const target = el.querySelector('[data-brief-target]')
  if (target) frame(target, { centre: true })
  else alignTop(el)
}

watch(
  () => brief.answers,
  () => {
    error.value = null
    announcement.value = ''
    cancelClear({ refocus: false })
  },
  { deep: true },
)

const screenKey = computed(() => (isDraft.value ? `step-${brief.stepIndex}-${restarts.value}` : brief.status))
</script>

<template>
  <!-- A faint dashed focus ring for keyboard users. Not on text fields, which turn olive, or on headings focused in code. -->
  <div
    class="flex min-h-svh flex-col justify-center bg-black text-white [&_:focus-visible:not(input,[tabindex='-1'])]:outline-1 [&_:focus-visible:not(input,[tabindex='-1'])]:outline-dashed [&_:focus-visible:not(input,[tabindex='-1'])]:outline-offset-2 [&_:focus-visible:not(input,[tabindex='-1'])]:outline-white/50 [&_[tabindex='-1']]:outline-none"
  >
    <div
      class="wrapper pt-[calc(var(--dock-height)+--spacing(20))] pb-30 md:pt-[calc(var(--dock-height)+--spacing(40))] md:pb-60"
    >
      <div
        ref="root"
        class="mx-auto w-full max-w-174"
      >
        <!-- Only as tall as the step, so the nav sits right under it. Still sticky for steps taller than the screen -->
        <div class="flex w-full flex-col gap-6 md:gap-15">
          <div ref="content">
            <Transition
              :name="brief.direction === 1 ? 'brief-forward' : 'brief-back'"
              mode="out-in"
              @enter="onEnter"
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

          <nav
            ref="nav"
            aria-label="Brief steps"
            class="sticky bottom-4 z-10 grid rounded-20 corner-shape-squircle bg-offblack-glass/50 text-grey outline outline-1 outline-white/15 backdrop-blur-sm shadow-2xl"
          >
            <Transition name="brief-nav">
              <div
                v-if="confirmingClear"
                data-brief-confirm
                class="flex items-center gap-2 p-2.5 pl-4 col-start-1 row-start-1 md:gap-5 md:pl-5"
              >
                <p
                  class="flex-1 text-14 font-medium whitespace-nowrap md:text-16"
                  role="status"
                >
                  Clear everything?
                </p>

                <!-- Wrapped so the stagger can move it: the button's own transition is for hover and press -->
                <div class="flex">
                  <button
                    ref="cancelButton"
                    type="button"
                    class="h-11 rounded-full bg-black px-4 text-14 font-medium md:px-5 md:text-16 leading-none text-white transition-[background-color,scale] duration-200 ease-outCubic active:scale-96 only-hover:hover:bg-white/10"
                    @click="cancelClear()"
                  >
                    Cancel
                  </button>
                </div>

                <div class="flex">
                  <button
                    type="button"
                    class="h-11 rounded-full bg-coral px-4 text-14 font-medium md:px-5 md:text-16 leading-none text-black transition-[opacity,scale] duration-200 ease-outCubic active:scale-96 only-hover:hover:opacity-85"
                    @click="clear"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div
                v-else
                class="relative flex items-center gap-3 p-2.5 pl-4 col-start-1 row-start-1 md:gap-5 md:pl-2.5"
              >
                <div
                  v-if="isDraft"
                  class="flex flex-1 flex-col gap-2.5 md:w-60 md:flex-none md:pl-1"
                >
                  <p class="text-14 leading-none trim-both">
                    {{ brief.isSummary ? 'Review' : `${position} of ${brief.total}` }}
                  </p>

                  <!-- A hairline along the bar's top edge on mobile, under the count on desktop -->
                  <div
                    class="relative h-0.5 overflow-hidden bg-putty max-md:absolute max-md:inset-x-4 max-md:top-0"
                    role="progressbar"
                    aria-label="Progress"
                    :aria-valuetext="brief.isSummary ? 'Review' : `${position} of ${brief.total}`"
                    :aria-valuenow="Math.min(position, brief.total)"
                    aria-valuemin="1"
                    :aria-valuemax="brief.total"
                  >
                    <div
                      class="absolute inset-y-0 left-0 w-full origin-left bg-coral transition-transform duration-500 ease-outQuart"
                      :style="{ transform: `scaleX(${progress})` }"
                    />
                  </div>
                </div>

                <p
                  v-else
                  class="flex-1 pl-1 text-14"
                >
                  {{ brief.status === 'sent' ? 'Prototype' : 'Brief sent' }}
                </p>

                <!-- Sits just above the bar on mobile, so it never pushes the buttons apart -->
                <p
                  v-if="error"
                  class="pl-1 text-14 text-coral max-md:absolute max-md:bottom-full max-md:left-0 max-md:mb-2 max-md:rounded-20 max-md:corner-shape-squircle max-md:bg-offblack-glass/50 max-md:outline max-md:outline-1 max-md:outline-white/15 max-md:backdrop-blur-sm max-md:px-4 max-md:py-2"
                  role="alert"
                >
                  {{ error }}
                </p>

                <!-- In tab order Next comes first, then Previous, then Start again: Next is what's wanted nearly every
                     time. Reversed back for display, so they still read left to right as Start again, Previous, Next. -->
                <div class="flex flex-row-reverse items-center gap-2.5 md:ml-auto md:gap-5">
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

                  <button
                    v-if="brief.status !== 'confirmed'"
                    type="button"
                    class="rounded-full disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Previous"
                    :disabled="isDraft && brief.stepIndex === 0"
                    @click="back"
                  >
                    <UiButton
                      text="Previous"
                      theme="dark"
                      size="medium"
                      class="max-md:hidden"
                    />

                    <span class="flex size-11 items-center justify-center rounded-full bg-black md:hidden">
                      <span class="flex size-7 items-center justify-center rounded-full bg-accent">
                        <IconPixelArrow class="w-[55%] -rotate-90" />
                      </span>
                    </span>
                  </button>

                  <!-- Stays while its icon spins after a clear, then goes: there's nothing left to clear -->
                  <Transition
                    name="brief-pop"
                    @after-leave="spinning = false"
                  >
                    <button
                      v-if="isDraft && (hasStarted || clearing)"
                      ref="resetButton"
                      type="button"
                      aria-label="Start again"
                      class="group flex size-11 items-center justify-center rounded-full bg-black text-beige transition-[color,scale] duration-200 ease-outCubic active:scale-92 only-hover:hover:text-white"
                      :inert="clearing"
                      @click="askToClear"
                    >
                      <!-- Hover winds it back a little on a spring; clearing turns it all the way round -->
                      <IconReset
                        class="size-4.5 transition-[rotate] motion-reduce:rotate-0!"
                        :class="
                          spinning
                            ? '-rotate-360 duration-700 ease-outQuart'
                            : 'duration-600 ease-spring-3 only-hover:group-hover:-rotate-45'
                        "
                      />
                    </button>
                  </Transition>
                </div>
              </div>
            </Transition>
          </nav>

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
