import { defineStore } from 'pinia'
import type { BriefFieldKey } from '#shared/schemas/brief'
import type { BriefDraft } from '@/utils/brief'
import { briefOptions } from '#shared/schemas/brief'

export type BriefStatus = 'draft' | 'sent' | 'confirmed'

// The in-progress brief. Lives only in this browser (localStorage) until it's sent.
export const useBriefStore = defineStore(
  'brief',
  () => {
    // Typed from the shared Zod schema. Mutated in place so Regle, bound to it, sees every change.
    const answers = ref<BriefDraft>({})
    const stepIndex = ref(0)
    const editingFromSummary = ref(false)
    const status = ref<BriefStatus>('draft')
    // Which way the last move went, for the slide direction. Not persisted.
    const direction = ref<1 | -1>(1)

    const summaryIndex = briefSteps.length
    // The summary isn't counted: "1 of 12" covers the questions
    const total = briefSteps.length
    const step = computed(() => briefSteps[stepIndex.value])
    const isSummary = computed(() => stepIndex.value === summaryIndex)

    function setAnswer<K extends BriefFieldKey>(key: K, value: BriefDraft[K]) {
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

    function goTo(index: number, fromSummary = false) {
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

    function setStatus(value: BriefStatus) {
      direction.value = 1
      status.value = value
    }

    function reset() {
      answers.value = {}
      stepIndex.value = 0
      editingFromSummary.value = false
      status.value = 'draft'
      direction.value = -1
    }

    return {
      answers,
      stepIndex,
      editingFromSummary,
      status,
      direction,
      summaryIndex,
      total,
      step,
      isSummary,
      setAnswer,
      dropStaleChoices,
      upgradeSavedAnswers,
      goTo,
      next,
      back,
      setStatus,
      reset,
    }
  },
  {
    persist: {
      pick: ['answers', 'stepIndex', 'editingFromSummary', 'status'],
      storage: piniaPluginPersistedstate.localStorage(),
      afterHydrate: ({ store }) => {
        store.upgradeSavedAnswers()
        store.dropStaleChoices()
      },
    },
  },
)
