import { defineStore } from 'pinia'
import type { BriefAnswer, BriefAnswers } from '@/utils/brief'

export type BriefStatus = 'draft' | 'sent' | 'confirmed'

// The in-progress brief. Lives only in this browser (localStorage) until it's sent.
export const useBriefStore = defineStore(
  'brief',
  () => {
    const answers = ref<BriefAnswers>({})
    const stepIndex = ref(0)
    const editingFromSummary = ref(false)
    const status = ref<BriefStatus>('draft')
    // Which way the last move went, for the slide direction. Not persisted.
    const direction = ref<1 | -1>(1)

    const summaryIndex = briefSteps.length
    const total = briefSteps.length + 1
    const step = computed(() => briefSteps[stepIndex.value])
    const isSummary = computed(() => stepIndex.value === summaryIndex)

    function setAnswer(key: string, value: BriefAnswer) {
      answers.value = { ...answers.value, [key]: value }
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
    },
  },
)
