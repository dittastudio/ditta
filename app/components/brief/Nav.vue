<script lang="ts" setup>
import { onClickOutside, onKeyStroke, useResizeObserver } from '@vueuse/core'
import { gsap } from 'gsap'
import { defineSound } from '@web-kits/audio'
import IconReset from '@/assets/icons/reset.svg'
import IconReturn from '@/assets/icons/return.svg'
import IconClose from '@/assets/icons/close.svg'
import IconSettings from '@/assets/icons/settings.svg'
import { drawerClose, drawerOpen, error as errorSound, pageExit, warning } from '@@/.web-kits/core'

interface Props {
  // Why Next was blocked, shown above the bar on mobile and beside it on desktop
  error?: string | null
}

const { error = null } = defineProps<Props>()
// Set by the brief when Next is blocked; cleared here once the shake has played
const shaking = defineModel<boolean>('shaking', { default: false })

// Next being blocked is heard as well as seen
const soundError = defineSound(errorSound)
// Start again warns as it asks to be sure (each button's hover sound is UiNavButton's)
const soundWarning = defineSound(warning)
// Settings open out of their button and fold back into it with ✕
const soundDrawerOpen = defineSound(drawerOpen)
const soundDrawerClose = defineSound(drawerClose)
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
const settingsButton = useTemplateRef('settingsButton')

const hasPrevious = computed(() => brief.status === 'sent' || (brief.inProgress && brief.stepIndex > 0))
const position = computed(() => brief.stepIndex + 1)
const progress = computed(() => (brief.isSummary ? 1 : brief.stepIndex / brief.total))

const advanceLabels = { summary: 'Back to summary', review: 'Review', skip: 'Skip', next: 'Next' }

const primaryLabel = computed(() => {
  if (brief.status === 'sent') return brief.sending ? 'Sending…' : 'Resend'
  if (brief.status === 'confirmed') return 'Start over'
  if (brief.isSummary) return brief.sending ? 'Sending…' : 'Send'
  return advanceLabels[brief.advance]
})

// Enter moves on from any question and sends from the review, and Shift+Enter goes back (see useBriefKeys), announced
// to assistive tech on the buttons and shown as their keys
const enterAdvances = computed(() => brief.inProgress)

// Back goes through the browser's history, so the browser's own Back does the same (see useBriefHistory)
const briefHistory = useBriefHistory(() => play(soundPageExit))

function back() {
  if (!hasPrevious.value || brief.sending) return
  play(soundPageExit)
  briefHistory.back()
}

// The settings button turns the nav into a row of settings, in the same cell, and Start again in there turns it into a
// "Clear everything?" confirm. Focus goes to the panel's first visible data-autofocus as it opens (Cancel, so a
// reflexive Enter is safe), and back to the settings button when either is closed with Cancel, ✕ or Esc. A click
// outside closes either; answering closes the confirm, and a new step closes settings.
const panel = ref<'clear' | 'settings' | null>(null)

function focusPanel(el: Element) {
  const targets = [...el.querySelectorAll<HTMLElement>('[data-autofocus]')]
  targets.find((target) => target.checkVisibility())?.focus()
}

async function closePanel() {
  if (!panel.value) return
  panel.value = null
  await nextTick()
  settingsButton.value?.$el.focus()
}

watch([() => brief.stepIndex, () => brief.status], () => {
  if (panel.value === 'settings') panel.value = null
})
watch(
  () => brief.answers,
  () => {
    if (panel.value === 'clear') panel.value = null
  },
  { deep: true },
)
onKeyStroke('Escape', closePanel)
onClickOutside(nav, () => (panel.value = null))

// Clearing winds the settings cog back a full turn, where Start again was pressed from. On the cog's transform, so it
// stacks with its hover turn (the `rotate` property), and a full turn lands it looking just as it started.
const settingsIcon = useTemplateRef('settingsIcon')

function clear() {
  panel.value = null
  soundStartup.play()
  brief.reset()
  emit('cleared')

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // The cog is back once the confirm has gone, a frame later
  requestAnimationFrame(() => {
    const icon = settingsIcon.value?.$el
    if (!(icon instanceof Element)) return
    gsap.fromTo(icon, { rotation: 0 }, { rotation: -360, duration: 0.7, ease: 'power4.out', clearProps: 'transform' })
  })
}

// Settings and Previous sit side by side, right-aligned, so one coming or going, or Next or Previous
// widening for its key, moves everything to its left. Those glide there rather than jumping: measured just before the
// change, then sprung back from where they were (FLIP). It starts with the pop and overshoots a touch before settling,
// so it reads as being nudged aside rather than slid. The row is reversed for display, so what sits to the left of an
// item comes after it in the DOM.
const group = useTemplateRef('group')
const lefts = new Map<HTMLElement, number>()

// Only what's laid out in the row: not something hidden at this width, or lifted out of the row as it leaves
const inRow = (el: HTMLElement) => el.getClientRects().length > 0 && el.style.position !== 'absolute'
const items = () => [...(group.value?.children ?? [])].filter((el): el is HTMLElement => el instanceof HTMLElement)

function glideItem(el: HTMLElement, offset: number, delay = 0) {
  glide(el, 'x', offset, {
    duration: 0.5,
    // elastic is a damped sine, the shape of a spring: a 1.1 period overshoots by about 4% and settles with no
    // visible dip, a gentle nudge rather than a wobble
    ease: 'elastic.out(1, 1.1)',
    delay,
  })
}

function measureRow() {
  lefts.clear()
  for (const el of items()) if (inRow(el)) lefts.set(el, el.getBoundingClientRect().left)
}

// Both measurements include any glide still running, which glide() then carries on from. Every item is measured
// before any is moved, so the row is laid out once rather than once per item.
function glideRow(delay = 0) {
  const moves = [...lefts]
    .filter(([el]) => el.isConnected && inRow(el))
    .map(([el, from]) => [el, from - el.getBoundingClientRect().left] as const)
  lefts.clear()
  for (const [el, offset] of moves) glideItem(el, offset, delay)
}

// A leaving item would hold its space until it had faded, and the rest would jump after. Lifted out of the row where
// it stands, it fades in place, and the rest wait the same beat an item does coming in before they close the gap, so
// they never slide over it while it's still visible.
function onPopLeave(el: Element) {
  measureRow()
  liftInPlace(el as HTMLElement)
  glideRow(0.15)
}

// Each button in the row comes and goes the same way. One hook argument each, so Vue still runs the pop's CSS
// transition and tracks when it ends. Previous waits a beat coming in, so what's to their left moves
// aside first and they pop into the space left.
const pop = { name: 'brief-pop', onBeforeEnter: measureRow, onEnter: () => glideRow(), onLeave: onPopLeave }
const popLate = { ...pop, enterActiveClass: 'brief-pop-enter-active delay-100 motion-reduce:delay-0' }
// The row's buttons dim and can't be pressed while the brief is sending
const whileSending = computed(() => ({
  class: ['flex transition-opacity duration-200 ease-outCubic', { 'opacity-40': brief.sending }],
  inert: brief.sending,
}))

// Next's and Previous's keys take room only while shown (see UiKbd), so the row moves when they come and go. Their
// box is only measured once it has changed, so the move is the change in its width, given to everything to its left.
// A key leaving fades out first and only then gives its room back.
const enterKey = useTemplateRef('enterKey')
const backKey = useTemplateRef('backKey')
const keyWidths = new WeakMap<Element, number>()

function onKeyResize(entry: ResizeObserverEntry) {
  const width = entry.borderBoxSize[0]?.inlineSize ?? 0
  const before = keyWidths.get(entry.target)
  keyWidths.set(entry.target, width)
  const change = before === undefined ? 0 : width - before
  if (Math.abs(change) < 1) return

  const all = items()
  const at = all.findIndex((el) => el.contains(entry.target))
  for (const el of all.slice(at + 1).filter(inRow)) glideItem(el, change)
}

useResizeObserver([enterKey, backKey], (entries) => entries.forEach(onKeyResize))

onBeforeUnmount(() => gsap.killTweensOf(items()))

// The brief plays the sound that matches the label Next has, and goes back for Shift+Enter (see useBriefKeys)
defineExpose({ primaryLabel, back })
</script>

<template>
  <nav
    ref="nav"
    aria-label="Brief steps"
    data-crumb-surface="box"
    class="relative h-(--brief-nav-height) rounded-20 corner-shape-squircle bg-black/50 text-grey outline outline-1 outline-ash backdrop-blur-sm shadow-2xl"
  >
    <!-- The same glass, outline and corners as the Dock, so the two bars read as a pair. Crumbs from the thanks
         screen's burger can land on top of it. Inside the <nav>, not above it: a comment beside the root makes it a
         fragment in dev, and $el (which Shell's morph reads) would be the fragment's anchor rather than the bar. -->
    <!-- How the bar looks while it's still the intro's Start button, Next's faint square and label, for it to fade from
         as it grows (see useBriefMorph). The button itself is in Shell. -->
    <span
      data-brief-nav-start
      class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] corner-shape-inherit bg-white/15 pl-2 text-14 font-medium text-white opacity-0 md:text-16"
      aria-hidden="true"
    >
      Start
      <IconReturn class="ml-2 size-4 fill-none" />
    </span>

    <!-- Everything else, so the morph can fade it all as one -->
    <div
      data-brief-nav-contents
      class="rounded-[inherit] corner-shape-inherit"
    >
      <!-- Progress is a hairline along the bar's top edge, full width. Clipped in its own layer, not on the nav, so the
         error above the bar on mobile isn't cut off. -->
      <div
        v-if="brief.inProgress"
        data-brief-nav-part
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
            class="h-full origin-left bg-accent transition-[scale] duration-400 ease-outCubic motion-reduce:transition-none"
            :style="{ scale: `${progress} 1` }"
          />
        </div>
      </div>

      <!-- The step's controls, the clear confirm and settings swap in the same cell -->
      <div
        class="grid *:col-start-1 *:row-start-1 *:flex *:items-center *:gap-(--brief-nav-padding) *:p-(--brief-nav-padding)"
      >
        <Transition
          name="brief-rise"
          @enter="focusPanel"
        >
          <div
            v-if="panel === 'clear'"
            data-brief-panel
          >
            <p
              class="flex-1 pl-3 text-14 font-medium whitespace-nowrap md:text-16"
              role="status"
            >
              Clear everything?
            </p>

            <!-- Wrapped so the stagger can move it: the button's own transition is for hover and press -->
            <div class="flex">
              <UiNavButton
                data-autofocus
                @click="
                  play(soundDrawerClose);
                  closePanel()
                "
              >
                Cancel
              </UiNavButton>
            </div>

            <div class="flex">
              <UiNavButton
                variant="danger"
                @click="clear"
              >
                Clear
              </UiNavButton>
            </div>
          </div>

          <!-- One control per setting, each named by its own tooltip, so more can join without the row needing labels.
               Shortcuts only where there's room and likely a keyboard. Start again always: with nothing to clear, it
               just goes back to the start. -->
          <div
            v-else-if="panel === 'settings'"
            data-brief-panel
          >
            <p class="flex-1 pl-3 text-14 font-medium whitespace-nowrap md:text-16">Settings</p>

            <div
              role="group"
              aria-label="Settings"
              class="flex items-center gap-2"
            >
              <BriefSettingShortcuts
                data-autofocus
                class="max-md:hidden only-touch:hidden"
              />
              <ActionAudioToggle
                data-autofocus
                highlight
              />
              <ActionAccentCycle />
              <UiNavButton
                square
                aria-label="Start again"
                @click="
                  play(soundWarning);
                  panel = 'clear'
                "
              >
                <!-- Hover winds it back a little on a spring -->
                <IconReset
                  class="size-4.5 transition-[rotate] duration-600 ease-spring-3 only-hover:group-hover/button:-rotate-45 motion-reduce:rotate-0!"
                />
              </UiNavButton>
            </div>

            <div class="flex">
              <UiNavButton
                square
                aria-label="Close settings"
                @click="
                  play(soundDrawerClose);
                  closePanel()
                "
              >
                <IconClose class="size-4" />
              </UiNavButton>
            </div>
          </div>

          <div v-else>
            <p
              v-if="brief.inProgress"
              data-brief-nav-part
              class="shrink-0 pl-3 text-14 leading-none tabular-nums"
            >
              <template v-if="brief.isSummary">Review</template>
              <template v-else> {{ position }}<span class="text-grey/40"> / {{ brief.total }}</span> </template>
            </p>

            <p
              v-else
              data-brief-nav-part
              class="shrink-0 pl-3 text-14"
            >
              {{ brief.status === 'sent' ? 'Check your inbox' : 'Brief sent' }}
            </p>

            <!-- Beside the count on desktop. On mobile it sits just above the bar, so it never pushes the buttons apart. -->
            <p
              v-if="error"
              class="min-w-0 truncate pl-2 text-14 text-coral max-md:absolute max-md:bottom-full max-md:left-0 max-md:mb-2 max-md:max-w-full max-md:whitespace-normal max-md:rounded-20 max-md:corner-shape-squircle max-md:bg-black/50 max-md:outline max-md:outline-1 max-md:outline-ash max-md:backdrop-blur-sm max-md:px-4 max-md:py-2"
              role="alert"
            >
              {{ error }}
            </p>

            <!-- In tab order Next comes first, then Previous, then Settings: Next is what's wanted nearly every time.
               Reversed back for display, so they still read left to right as Settings, Previous, Next. -->
            <div
              ref="group"
              data-brief-nav-part
              class="ml-auto flex flex-row-reverse items-center gap-(--brief-nav-padding)"
            >
              <UiNavButton
                variant="primary"
                :class="{ 'shake-once': shaking }"
                :aria-keyshortcuts="enterAdvances ? 'Enter' : undefined"
                @click="emit('primary')"
                @animationend="shaking = false"
              >
                {{ primaryLabel }}
                <BriefKeyHint
                  v-if="enterAdvances"
                  ref="enterKey"
                  data-brief-enter-key
                />
              </UiNavButton>

              <!-- Not on the first step, where there's nowhere to go back to. Pops in on the second, as Start again does -->
              <Transition v-bind="popLate">
                <div
                  v-if="hasPrevious"
                  v-bind="whileSending"
                >
                  <UiNavButton
                    :aria-keyshortcuts="enterAdvances ? 'Shift+Enter' : undefined"
                    @click="back"
                  >
                    Back
                    <BriefKeyHint
                      v-if="enterAdvances"
                      ref="backKey"
                      shift
                      data-brief-back-key
                    />
                  </UiNavButton>
                </div>
              </Transition>

              <!-- There from the first step, leftmost. Wrapped so the pop can fade and blur it: the button's own
                   transition is for hover and press. -->
              <Transition v-bind="pop">
                <div
                  v-if="brief.inProgress"
                  v-bind="whileSending"
                >
                  <UiNavButton
                    ref="settingsButton"
                    square
                    aria-label="Settings"
                    @click="
                      play(soundDrawerOpen);
                      panel = 'settings'
                    "
                  >
                    <!-- Hover turns it a tooth on a spring, which lands it looking just as it started -->
                    <IconSettings
                      ref="settingsIcon"
                      class="size-4.5 transition-[rotate] duration-600 ease-spring-3 only-hover:group-hover/button:rotate-45 motion-reduce:rotate-0!"
                    />
                  </UiNavButton>
                </div>
              </Transition>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>
