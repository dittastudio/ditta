<script lang="ts" setup>
import type { BriefFieldKey } from '#shared/schemas/brief'
import type { BriefStep } from '#shared/utils/brief'
import { briefStepSchemas } from '#shared/schemas/brief'

interface Props {
  step: BriefStep
}

const { step } = defineProps<Props>()
const emit = defineEmits<{ submit: [] }>()

const brief = useBriefStore()

// This screen's schema: its question plus its follow-ups. A field isn't judged while it's first being typed into:
// its errors show once it's been left with something in it (see Field), or after Next. From then on they follow
// along as it changes.
const { r$ } = useRegleSchema(toRef(brief, 'answers'), briefStepSchemas[step.key], { autoDirty: false })
const touch = (key: BriefFieldKey) => r$.$fields[key]?.$touch()

const titleId = useId()
const title = computed(() => personaliseBrief(step.title, brief.answers))
const followUps = computed(() => visibleFollowUps(step, brief.answers))

// A follow-up going would hold its space while it fades, and the step would only glide closed after it had, a beat
// after the answer that closed it. Lifted out of the list where it stands, it fades in place while the step glides
// closed at once. The last one
// to go takes the whole list with it, or the list (hidden only once it's empty) would hold its place in the question,
// gap and all, until the fade was done. Single-argument hooks, so Vue still runs the fade's CSS transition.
const followUpList = useTemplateRef('followUpList')

function onFollowUpLeave(el: Element) {
  const list = followUpList.value?.$el as HTMLElement | undefined
  liftInPlace(list && !followUps.value.length ? list : (el as HTMLElement))
}

// Back in the question for the next follow-up to arrive
function onFollowUpBeforeEnter() {
  const list = followUpList.value?.$el as HTMLElement | undefined
  if (list) liftInPlace(list, false)
}

// A follow-up opening below the fold, or under the nav (its scroll-margin), comes into view once it's in place, title
// and field. Measured against the visible area, which the keyboard shrinks on a phone where the window doesn't.
const lenis = useLenis()
const appStore = useAppStore()

function reveal(el: Element) {
  const view = window.visualViewport
  const viewBottom = view ? view.offsetTop + view.height : window.innerHeight
  const box = el.getBoundingClientRect()
  const below = box.bottom - (viewBottom - Number.parseFloat(getComputedStyle(el).scrollMarginBottom))
  if (below <= 0) return

  // Never so far that its title goes up under the dock
  lenis.value?.scrollTo(window.scrollY + Math.min(below, box.top - appStore.getDockBottom))
}

// Its field takes focus as it opens, and on a phone the keyboard may still be coming up, so it's looked at again
// once the keyboard is up, while the field still has focus
function onFollowUpAfterEnter(el: Element) {
  reveal(el)
  if (!el.contains(document.activeElement)) return
  window.visualViewport?.addEventListener('resize', () => el.contains(document.activeElement) && reveal(el), {
    once: true,
  })
}

const emailSuggestion = computed(() =>
  step.field === 'email' && brief.answers.email ? suggestBriefEmail(brief.answers.email) : null,
)

type ErrorNode =
  | string[]
  | { $self?: string[]; $each?: ({ url?: ErrorNode; note?: ErrorNode } | undefined)[] }
  | undefined

const errorTree = computed(() => r$.$errors as Partial<Record<BriefFieldKey, ErrorNode>>)
const ownErrors = (node: ErrorNode): string[] => (Array.isArray(node) ? node : (node?.$self ?? []))
const errorsFor = (key: BriefFieldKey) => ownErrors(errorTree.value[key])
const rowErrorsFor = (key: BriefFieldKey) => {
  const node = errorTree.value[key]
  return Array.isArray(node)
    ? []
    : (node?.$each?.map((row) => ({ url: ownErrors(row?.url), note: ownErrors(row?.note) })) ?? [])
}

const answer = (key: BriefFieldKey) => brief.answers[key]
const setAnswer = (key: BriefFieldKey, value: unknown) => brief.setAnswer(key, value as never)

async function validate() {
  const { valid } = await r$.$validate()
  return valid
}

defineExpose({ validate })
</script>

<template>
  <section
    :aria-labelledby="titleId"
    class="relative flex flex-col gap-10 md:gap-15"
  >
    <div class="flex flex-col gap-5 md:gap-7.5">
      <h1
        :id="titleId"
        class="text-24 leading-tight text-balance trim-both md:text-28"
      >
        {{ title }}
      </h1>

      <p
        v-if="step.hint"
        class="text-16 opacity-60 text-pretty trim-both md:text-20"
      >
        {{ step.hint }}
      </p>
    </div>

    <BriefField
      :question="step"
      :labelledby="titleId"
      :model-value="answer(step.key)"
      :errors="errorsFor(step.key)"
      :row-errors="rowErrorsFor(step.key)"
      focus-on-mount
      @update:model-value="setAnswer(step.key, $event)"
      @submit="emit('submit')"
      @touch="touch(step.key)"
    />

    <Transition name="brief-reveal">
      <p
        v-if="emailSuggestion"
        class="-mt-2 text-16 opacity-60 md:-mt-9"
      >
        Did you mean
        <button
          type="button"
          class="font-medium underline underline-offset-4"
          @click="brief.setAnswer('email', emailSuggestion)"
        >
          {{ emailSuggestion }}</button
        >?
      </p>
    </Transition>

    <input
      v-if="step.field === 'email'"
      v-model="brief.honeypot"
      type="text"
      name="fax_number_confirm"
      autocomplete="off"
      tabindex="-1"
      aria-hidden="true"
      class="pointer-events-none fixed -left-full size-px opacity-0"
    />

    <p
      v-if="step.field === 'email'"
      class="-mt-2 text-16 opacity-60 md:-mt-9"
    >
      We'll only use this to reply about your project. See our
      <NuxtLink
        to="/privacy-policy"
        target="_blank"
        class="underline underline-offset-4 only-hover:hover:text-white"
        >privacy policy</NuxtLink
      >.
    </p>

    <TransitionGroup
      ref="followUpList"
      name="brief-reveal"
      tag="div"
      class="relative flex flex-col gap-6 empty:hidden md:gap-15"
      @before-enter="onFollowUpBeforeEnter"
      @after-enter="onFollowUpAfterEnter"
      @leave="onFollowUpLeave"
    >
      <div
        v-for="followUp in followUps"
        :key="followUp.key"
        class="flex scroll-mb-(--brief-nav-space) flex-col gap-4 md:gap-7.5"
      >
        <p
          :id="`${titleId}-${followUp.key}`"
          class="text-20 leading-tight trim-both"
        >
          {{ followUp.title }}
        </p>

        <BriefField
          :question="followUp"
          :labelledby="`${titleId}-${followUp.key}`"
          :model-value="answer(followUp.key)"
          :errors="errorsFor(followUp.key)"
          focus-on-mount
          @update:model-value="setAnswer(followUp.key, $event)"
          @submit="emit('submit')"
          @touch="touch(followUp.key)"
        />
      </div>
    </TransitionGroup>
  </section>
</template>
