import { defineStore } from 'pinia'
import type { BriefFieldKey } from '#shared/schemas/brief'
import type { BriefDraft } from '#shared/utils/brief'
import { briefOptions } from '#shared/schemas/brief'

// `intro` is the title and Start button before the first question
export type BriefStatus = 'intro' | 'draft' | 'sent' | 'confirmed'

const briefSettingDefaults = { shortcuts: false }

// The in-progress brief. Lives only in this browser (localStorage) until it's sent.
export const useBriefStore = defineStore(
  'brief',
  () => {
    // Typed from the shared Zod schema. Mutated in place so Regle, bound to it, sees every change.
    const answers = ref<BriefDraft>({})
    const stepIndex = ref(0)
    const editingFromSummary = ref(false)
    const status = ref<BriefStatus>('intro')
    // Still being filled in: the intro counts, as the first step's way in
    const inProgress = computed(() => status.value === 'draft' || status.value === 'intro')
    // Which way the last move went, for the slide direction. Not persisted.
    const direction = ref<1 | -1>(1)
    // When Start was pressed (or, for a draft from before the intro, the first answer given), so the server can turn away a brief filled in faster than a person could
    const startedAt = ref<number | null>(null)
    // Kept for the thank-you screen, since the answers are cleared once the brief has gone
    const sentName = ref('')
    // Not persisted: a send in flight, the Turnstile token for it, and the honeypot
    const sending = ref(false)
    const turnstileToken = ref('')
    // Turnstile reported an error (a hostname it isn't set up for, a blocked script), so no token is coming
    const turnstileFailed = ref(false)
    const honeypot = ref('')
    // Preferences from the nav's settings, rather than part of the draft, so Start again leaves them. Each setting has
    // its own control in the settings row (see BriefSettingShortcuts).
    // - shortcuts: whether the keyboard shortcut keys show (see UiKbd). Never on touch, whatever it's set to.
    const settings = ref({ ...briefSettingDefaults })
    // While the shortcuts setting is hovered or focused, the keys show faintly. Not persisted.
    const previewShortcuts = ref(false)
    const shortcuts = computed(() => (settings.value.shortcuts ? 'on' : previewShortcuts.value ? 'preview' : undefined))

    const summaryIndex = briefSteps.length
    // The summary isn't counted: "1 of 12" covers the questions
    const total = briefSteps.length
    const step = computed(() => briefSteps[stepIndex.value])
    const isSummary = computed(() => stepIndex.value === summaryIndex)
    // What the main button does on a question: shared by its label (Nav) and its sound (Shell)
    const advance = computed<'summary' | 'review' | 'skip' | 'next'>(() => {
      const current = step.value
      if (editingFromSummary.value) return 'summary'
      if (current?.field === 'email') return 'review'
      if (current && !isBriefStepRequired(current) && !hasBriefAnswer(answers.value[current.key])) return 'skip'
      return 'next'
    })

    function setAnswer<K extends BriefFieldKey>(key: K, value: BriefDraft[K]) {
      startedAt.value ??= Date.now()
      if (value === undefined) delete answers.value[key]
      else answers.value[key] = value
    }

    // A choice saved before its option was reworded or removed. Kept, it would fail validation with no card to
    // untick, and the client would be stuck on that step. Runs when a saved draft is loaded.
    function dropStaleChoices() {
      for (const [key, options] of Object.entries(briefOptions) as [keyof typeof briefOptions, readonly string[]][]) {
        const value: unknown = answers.value[key]

        if (Array.isArray(value)) {
          const kept = value.filter((choice) => options.includes(choice))
          if (kept.length === value.length) continue
          if (kept.length) answers.value[key] = kept as never
          else delete answers.value[key]
        } else if (typeof value === 'string' && !options.includes(value)) {
          delete answers.value[key]
        }
      }
    }

    // `files` was a single link before it became link rows. Runs when a saved draft is loaded.
    function upgradeSavedAnswers() {
      const files: unknown = answers.value.files
      if (typeof files !== 'string') return
      if (files.trim()) answers.value.files = [{ url: files, note: '' }]
      else delete answers.value.files
    }

    // A send clears the answers once it lands, so nothing can change under it while it's in flight
    function goTo(index: number, fromSummary = false) {
      if (sending.value) return
      direction.value = index >= stepIndex.value ? 1 : -1
      stepIndex.value = Math.min(Math.max(index, 0), summaryIndex)
      editingFromSummary.value = fromSummary
    }

    function next() {
      goTo(editingFromSummary.value ? summaryIndex : stepIndex.value + 1)
    }

    function back() {
      if (editingFromSummary.value) goTo(summaryIndex)
      else goTo(stepIndex.value - 1)
    }

    // Start, from the intro: on to the first question
    function start() {
      startedAt.value ??= Date.now()
      direction.value = 1
      status.value = 'draft'
    }

    // Back to the intro. Whatever's been answered stays, and Start picks up from the first question again.
    function showIntro() {
      direction.value = -1
      stepIndex.value = 0
      editingFromSummary.value = false
      status.value = 'intro'
    }

    function setStatus(value: BriefStatus) {
      direction.value = 1
      status.value = value
    }

    // The brief has reached the team: the answers go, so a refresh can't send it twice
    function markSent() {
      sentName.value = briefFirstName(answers.value)
      answers.value = {}
      startedAt.value = null
      honeypot.value = ''
      turnstileToken.value = ''
      editingFromSummary.value = false
      stepIndex.value = 0
      setStatus('confirmed')
    }

    // Start again, and Start over once a brief has gone: a new brief, from the intro
    function reset() {
      if (sending.value) return
      answers.value = {}
      startedAt.value = null
      sentName.value = ''
      honeypot.value = ''
      turnstileToken.value = ''
      stepIndex.value = 0
      editingFromSummary.value = false
      status.value = 'intro'
      direction.value = -1
    }

    return {
      answers,
      stepIndex,
      editingFromSummary,
      status,
      inProgress,
      direction,
      startedAt,
      sentName,
      sending,
      turnstileToken,
      turnstileFailed,
      honeypot,
      settings,
      previewShortcuts,
      shortcuts,
      summaryIndex,
      total,
      step,
      isSummary,
      advance,
      setAnswer,
      dropStaleChoices,
      upgradeSavedAnswers,
      goTo,
      next,
      back,
      start,
      showIntro,
      setStatus,
      markSent,
      reset,
    }
  },
  {
    persist: {
      pick: ['answers', 'stepIndex', 'editingFromSummary', 'status', 'startedAt', 'sentName', 'settings'],
      storage: piniaPluginPersistedstate.localStorage(),
      afterHydrate: ({ store }) => {
        // A setting added since these were saved takes its default
        store.settings = { ...briefSettingDefaults, ...store.settings }
        store.upgradeSavedAnswers()
        store.dropStaleChoices()
      },
    },
  },
)
