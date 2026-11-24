<script lang="ts" setup>
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { gsap } from 'gsap'
import { defineSound } from '@web-kits/audio'
import IconReset from '@/assets/icons/reset.svg'
import { error as errorSound, hover, pageExit, warning } from '@@/.web-kits/core'

interface Props {
  // Why Next was blocked, shown above the bar on mobile and beside it on desktop
  error?: string | null
}

const { error = null } = defineProps<Props>()
// Set by the brief when Next is blocked; cleared here once the shake has played
const shaking = defineModel<boolean>('shaking', { default: false })

// Next being blocked is heard as well as seen
const soundError = defineSound(errorSound)
// Start again: the hover the bar's other buttons have, and a warning as it asks to be sure
const soundHover = defineSound(hover)
const soundWarning = defineSound(warning)
// Back turns the page the other way from Skip's
const soundPageExit = defineSound(pageExit)
const { play, isAudioOn } = useAudio()
// Clearing the brief boots it up afresh
const soundStartup = defineSample('/sounds/winxpstartup.opus')
watch(isAudioOn, (on) => on && soundStartup.load(), { immediate: true })

watch(shaking, (now) => {
  if (now) play(soundError)
})
// `cleared` fires once the draft has been wiped, for the brief to rebuild its first screen
const emit = defineEmits<{ primary: []; cleared: [] }>()

const brief = useBriefStore()
const nav = useTemplateRef('nav')
const resetButton = useTemplateRef('resetButton')
const cancelButton = useTemplateRef('cancelButton')

const isDraft = computed(() => brief.status === 'draft')
const hasPrevious = computed(() => brief.status === 'sent' || (isDraft.value && brief.stepIndex > 0))
const position = computed(() => brief.stepIndex + 1)
const progress = computed(() => (brief.isSummary ? 1 : brief.stepIndex / brief.total))

const primaryLabel = computed(() => {
  if (brief.status === 'sent') return 'Simulate confirm'
  if (brief.status === 'confirmed') return 'Start over'
  if (brief.isSummary) return brief.sending ? 'Sending…' : 'Send brief'
  if (brief.editingFromSummary) return 'Back to summary'
  if (brief.step?.field === 'email') return 'Review'
  if (brief.step && !isBriefStepRequired(brief.step) && !hasBriefAnswer(brief.answers[brief.step.key])) return 'Skip'

  return 'Next'
})

// Enter moves on from any question (see useBriefKeys), announced to assistive tech on the primary button. Not on the
// review, where sending takes a deliberate press.
const enterAdvances = computed(() => isDraft.value && !brief.isSummary)

// Back goes through the browser's history, so the browser's own Back does the same (see useBriefHistory)
const briefHistory = useBriefHistory(() => play(soundPageExit))

function back() {
  play(soundPageExit)
  briefHistory.back()
}

// Start again wipes the whole draft, so the nav turns into a "Clear everything?" confirm first. Cancel takes focus,
// so a reflexive Enter is safe. Esc, a click outside the nav, or answering anything all count as carrying on.
const hasStarted = computed(() => brief.stepIndex > 0 || Object.keys(brief.answers).length > 0)
const confirmingClear = ref(false)
// True while the icon spins its full turn after clearing, so the button stays put long enough to be seen doing it.
// The nav's steps come back with a fresh button, so `spinning` starts the turn a frame after it mounts at rest.
const clearing = ref(false)
const spinning = ref(false)

async function askToClear() {
  play(soundWarning)
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
  clearing.value = true
  spinning.value = false
  // Reduced motion holds the icon still, so there's no turn to wait for
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) clearing.value = false
  else requestAnimationFrame(() => requestAnimationFrame(() => (spinning.value = true)))

  soundStartup.play()
  brief.reset()
  emit('cleared')
}

onKeyStroke('Escape', () => cancelClear())
onClickOutside(nav, () => cancelClear({ refocus: false }))
// The button goes once the turn has finished, or been cut short
function onSpun(event: TransitionEvent) {
  if (spinning.value && event.propertyName === 'rotate') clearing.value = false
}

watch(
  () => brief.answers,
  () => cancelClear({ refocus: false }),
  { deep: true },
)

// Previous sits beside Start again, so it coming or going moves Start again by its width. Start again glides there
// rather than jumping: measured just before the change, then sprung back from where it was (FLIP). It starts with
// the pop and overshoots a touch before settling, so it reads as being nudged aside rather than slid.
let resetFrom: number | undefined

function measureReset() {
  resetFrom = resetButton.value?.getBoundingClientRect().left
}

function glideReset(delay = 0) {
  const el = resetButton.value?.parentElement
  const from = resetFrom
  resetFrom = undefined
  // Both measurements include any glide still running, which glide() then carries on from
  if (el && from !== undefined)
    glide(el, 'x', from - el.getBoundingClientRect().left, {
      duration: 0.7,
      // elastic is a damped sine, the shape of a spring: a 0.9 period overshoots by about 7% and settles with
      // barely a dip, much like --ease-spring-2
      ease: 'elastic.out(1, 0.9)',
      delay,
    })
}

// Single-argument hooks, so Vue still runs the pop's CSS transition and tracks when it ends
function onPreviousEnter() {
  glideReset()
}

// A leaving Previous would hold its space until it had faded, and Start again would jump after. Lifted out of the
// row where it stands, it fades in place, and Start again waits the same beat Previous does coming in before it
// closes the gap, so it never slides over Previous while it's still visible.
function onPreviousLeave(el: Element) {
  measureReset()
  const wrapper = el as HTMLElement
  Object.assign(wrapper.style, {
    position: 'absolute',
    left: `${wrapper.offsetLeft}px`,
    top: `${wrapper.offsetTop}px`,
  })
  glideReset(0.15)
}

onBeforeUnmount(() => {
  if (resetButton.value?.parentElement) gsap.killTweensOf(resetButton.value.parentElement)
})

// The brief plays the sound that matches the label Next has
defineExpose({ primaryLabel })
</script>

<template>
  <!-- The same glass, outline and corners as the Dock, so the two bars read as a pair. Crumbs from the thanks
       screen's burger can land on top of it. -->
  <nav
    ref="nav"
    aria-label="Brief steps"
    data-crumb-surface="box"
    class="relative rounded-20 corner-shape-squircle bg-black/50 text-grey outline outline-1 outline-white/15 backdrop-blur-sm shadow-2xl"
  >
    <!-- Progress is a hairline along the bar's top edge, full width. Clipped in its own layer, not on the nav, so the
         error above the bar on mobile isn't cut off. -->
    <div
      v-if="isDraft"
      class="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] corner-shape-inherit"
    >
      <div
        class="absolute inset-x-0 top-0 h-0.5 bg-white/10"
        role="progressbar"
        aria-label="Progress"
        :aria-valuetext="brief.isSummary ? 'Review' : `${position} of ${brief.total}`"
        :aria-valuenow="Math.min(position, brief.total)"
        aria-valuemin="1"
        :aria-valuemax="brief.total"
      >
        <div
          class="h-full origin-left bg-accent transition-[scale] duration-500 ease-outCubic motion-reduce:transition-none"
          :style="{ scale: `${progress} 1` }"
        />
      </div>
    </div>

    <!-- The step's controls and the clear confirm swap in the same cell -->
    <div class="grid">
      <Transition name="brief-rise">
        <div
          v-if="confirmingClear"
          data-brief-confirm
          class="flex items-center gap-2 p-2 col-start-1 row-start-1"
        >
          <p
            class="flex-1 pl-3 text-14 font-medium whitespace-nowrap md:text-16"
            role="status"
          >
            Clear everything?
          </p>

          <!-- Wrapped so the stagger can move it: the button's own transition is for hover and press -->
          <div class="flex">
            <button
              ref="cancelButton"
              type="button"
              class="rounded-full"
              @click="cancelClear()"
            >
              <UiButton
                text="Cancel"
                :icon="false"
                theme="dark"
                size="medium"
                :sound="hover"
              />
            </button>
          </div>

          <div class="flex">
            <button
              type="button"
              class="rounded-full"
              @click="clear"
            >
              <UiButton
                text="Clear"
                :icon="false"
                theme="coral"
                size="medium"
                :sound="hover"
              />
            </button>
          </div>
        </div>

        <div
          v-else
          class="flex items-center gap-2 p-2 col-start-1 row-start-1"
        >
          <p
            v-if="isDraft"
            class="shrink-0 pl-3 text-14 leading-none tabular-nums"
          >
            <template v-if="brief.isSummary">Review</template>
            <template v-else> {{ position }}<span class="text-grey/40"> / {{ brief.total }}</span> </template>
          </p>

          <p
            v-else
            class="shrink-0 pl-3 text-14"
          >
            {{ brief.status === 'sent' ? 'Prototype' : 'Brief sent' }}
          </p>

          <!-- Beside the count on desktop. On mobile it sits just above the bar, so it never pushes the buttons apart. -->
          <p
            v-if="error"
            class="min-w-0 truncate pl-2 text-14 text-coral max-md:absolute max-md:bottom-full max-md:left-0 max-md:mb-2 max-md:max-w-full max-md:whitespace-normal max-md:rounded-20 max-md:corner-shape-squircle max-md:bg-black/50 max-md:outline max-md:outline-1 max-md:outline-white/15 max-md:backdrop-blur-sm max-md:px-4 max-md:py-2"
            role="alert"
          >
            {{ error }}
          </p>

          <!-- In tab order Next comes first, then Previous, then Start again: Next is what's wanted nearly every
               time. Reversed back for display, so they still read left to right as Start again, Previous, Next. -->
          <div class="ml-auto flex flex-row-reverse items-center gap-2">
            <button
              type="button"
              class="rounded-full"
              :class="{ 'shake-once': shaking }"
              :aria-keyshortcuts="enterAdvances ? 'Enter' : undefined"
              @click="emit('primary')"
              @animationend="shaking = false"
            >
              <UiButton
                :text="primaryLabel"
                theme="light"
                :icon="false"
                size="medium"
                :sound="hover"
              />
            </button>

            <!-- Not on the first step, where there's nowhere to go back to. Pops in on the second, as Start again does -->
            <!-- Coming in, it waits a beat so Start again moves aside first and it pops into the space left -->
            <Transition
              name="brief-pop"
              enter-active-class="brief-pop-enter-active delay-150 motion-reduce:delay-0"
              @before-enter="measureReset"
              @enter="onPreviousEnter"
              @leave="onPreviousLeave"
            >
              <div
                v-if="hasPrevious"
                class="flex transition-opacity duration-200 ease-outCubic"
                :class="{ 'opacity-40': brief.sending }"
                :inert="brief.sending"
              >
                <button
                  type="button"
                  class="rounded-full"
                  @click="back"
                >
                  <UiButton
                    text="Back"
                    theme="dark"
                    :icon="false"
                    size="medium"
                    :sound="hover"
                  />
                </button>
              </div>
            </Transition>

            <!-- Stays while its icon spins after a clear, then goes: there's nothing left to clear -->
            <Transition
              name="brief-pop"
              @after-leave="spinning = false"
            >
              <!-- Wrapped so the pop can fade and blur it: the button's own transition is for hover and press -->
              <div
                v-if="isDraft && (hasStarted || clearing)"
                class="flex transition-opacity duration-200 ease-outCubic"
                :class="{ 'opacity-40': brief.sending }"
                :inert="brief.sending"
              >
                <button
                  ref="resetButton"
                  type="button"
                  aria-label="Start again"
                  class="group flex size-(--ui-button-medium-height) items-center justify-center rounded-full bg-black text-beige transition-[color,scale] duration-200 ease-outCubic active:scale-92 only-hover:hover:text-white"
                  :inert="clearing"
                  @pointerenter="play(soundHover)"
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
                    @transitionend="onSpun"
                    @transitioncancel="onSpun"
                  />
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>
  </nav>
</template>
