<script lang="ts" setup>
import { useEventListener, usePreferredReducedMotion, useResizeObserver } from '@vueuse/core'
import { gsap } from 'gsap'
import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'
import { briefAnswersSchema } from '#shared/schemas/brief'

const brief = useBriefStore()
const root = useTemplateRef('root')
const content = useTemplateRef('content')
const nav = useTemplateRef('nav')
const heading = useTemplateRef('heading')
const question = useTemplateRef('question')

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
// The brief is centred on the screen, so a new height moves the heading too, by the change in the content's top.
// It glides alongside the nav. The content itself doesn't need to: it's fading in anyway.
const reducedMotion = usePreferredReducedMotion()
let glides: gsap.core.Tween[] = []
// The content's last size and page position. The position is kept because a new height moves the content's top
// too, and by the time the resize is reported the old top is gone.
let last: { width: number; height: number; top: number } | undefined

const gliding = () => [nav.value, heading.value].filter((el): el is HTMLElement => !!el)
const glidingY = (el: HTMLElement | null) => (el ? Number(gsap.getProperty(el, 'y')) : 0)

function stopGliding() {
  glides.forEach((glide) => glide.kill())
  glides = []
  if (gliding().length) gsap.set(gliding(), { clearProps: 'transform' })
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

  // Mid-glide, carry on from wherever each has got to on screen
  const offsets = new Map([
    [nav.value, from + glidingY(nav.value) - to],
    [heading.value, previous.top + glidingY(heading.value) - last.top],
  ])
  const distance = Math.max(...[...offsets.values()].map(Math.abs))
  if (distance < 1) return

  // Short moves land with the step's own 250ms; longer ones take a little more, never outlasting the 600ms scroll
  const duration = gsap.utils.clamp(0.25, 0.45, 0.2 + distance / 1500)

  glides = [...offsets]
    .filter((pair): pair is [HTMLElement, number] => !!pair[0] && Math.abs(pair[1]) >= 1)
    .map(([el, offset]) =>
      gsap.fromTo(
        el,
        { y: offset },
        // power3.out is --ease-outCubic, the step transition's curve, so both settle the same way
        { y: 0, duration, ease: 'power3.out', overwrite: true, clearProps: 'transform' },
      ),
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
    return frameFirstError(root.value)
  }

  brief.next()
}

// "Start again" wipes the whole draft, so it takes a second tap within a few seconds
const hasStarted = computed(() => brief.stepIndex > 0 || Object.keys(brief.answers).length > 0)
const confirmingRestart = ref(false)
// Bumped on restart so the first screen is rebuilt clean, even when restarting from it, rather than flagging the
// answers that just disappeared as missing
const restarts = ref(0)
let restartTimer: ReturnType<typeof setTimeout> | undefined

function restart() {
  clearTimeout(restartTimer)

  if (!confirmingRestart.value) {
    confirmingRestart.value = true
    restartTimer = setTimeout(() => (confirmingRestart.value = false), 3000)
    return
  }

  confirmingRestart.value = false
  error.value = null
  brief.reset()
  restarts.value++
  disengage()
}

onUnmounted(() => clearTimeout(restartTimer))

function back() {
  if (brief.status === 'sent') return brief.setStatus('draft')
  brief.back()
}

// Each new screen frames its field once it has mounted, so it measures the real thing. Doesn't run on first render.
function onEnter(el: Element) {
  const target = el.querySelector('[data-brief-target]')
  if (target) frame(target)
  else alignTop(el)
}

watch(
  () => brief.answers,
  () => (error.value = null),
  { deep: true },
)

const screenKey = computed(() => (isDraft.value ? `step-${brief.stepIndex}-${restarts.value}` : brief.status))
</script>

<template>
  <div class="flex min-h-svh flex-col justify-center bg-black text-white">
    <div
      class="wrapper pt-[calc(var(--dock-height)+--spacing(20))] pb-30 md:pt-[calc(var(--dock-height)+--spacing(40))] md:pb-60"
    >
      <div
        ref="root"
        class="mx-auto flex w-full max-w-174 flex-col items-center gap-12 md:gap-25"
      >
        <div
          ref="heading"
          class="flex flex-col items-center gap-5 md:flex-row md:items-baseline md:gap-8"
        >
          <p class="text-40 leading-tight trim-both md:text-64">Create your brief</p>

          <!-- Kept in the layout before there's anything to clear, so it doesn't push the form down on the first pick -->
          <button
            type="button"
            class="text-12 leading-none text-beige underline-offset-4 transition-colors only-hover:hover:text-white only-hover:hover:underline"
            :class="{ 'text-coral only-hover:hover:text-coral': confirmingRestart, invisible: !hasStarted }"
            :inert="!hasStarted"
            @click="restart"
          >
            {{ confirmingRestart ? 'Tap again to clear' : 'Start again' }}
          </button>
        </div>

        <!-- Only as tall as the step, so the nav sits right under it. Still sticky for steps taller than the screen -->
        <div class="flex w-full flex-col gap-10 md:gap-15">
          <div ref="content">
            <Transition
              :name="brief.direction === 1 ? 'brief-forward' : 'brief-back'"
              mode="out-in"
              @enter="onEnter"
            >
              <div
                :key="screenKey"
                class="w-full"
                @pointerdown="engagement.onPointerdown"
                @click="engagement.onClick"
                @focusin="engagement.onFocusin"
              >
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
            class="sticky bottom-4 z-10 flex items-center gap-3 rounded-10 bg-offblack p-2.5 pl-4 md:gap-5 md:pl-2.5"
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
              class="pl-1 text-14 text-coral max-md:absolute max-md:bottom-full max-md:left-0 max-md:mb-2 max-md:rounded-10 max-md:bg-offblack max-md:px-4 max-md:py-2"
              aria-live="polite"
            >
              {{ error }}
            </p>

            <div class="flex items-center gap-2.5 md:ml-auto md:gap-5">
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
            </div>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>
