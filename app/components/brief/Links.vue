<script lang="ts" setup>
import type { BriefLinkRow, BriefLinkRowErrors } from '#shared/utils/brief'

const MAX = 3

interface Props {
  rowErrors?: BriefLinkRowErrors[]
  // Examples for the link field, shown in turn while it's empty. The first is the native placeholder.
  placeholders?: readonly string[]
  notePlaceholder?: string
  // A reminder under links from hosts where files are private until shared
  sharingNudge?: boolean
  // The first row takes focus as it mounts
  focusOnMount?: boolean
}

const {
  rowErrors = [],
  placeholders = ['acme.com'],
  notePlaceholder = 'What do you like about it? (optional)',
  sharingNudge = false,
  focusOnMount = false,
} = defineProps<Props>()
const model = defineModel<BriefLinkRow[] | undefined>()
const emit = defineEmits<{ submit: [] }>()

const list = useTemplateRef('list')
const frame = useBriefFrame()

// A row added by hand takes focus and comes into view; the rows already there on load leave focus to the first
const added = ref(false)

// Always at least one row to type into
const rows = computed<BriefLinkRow[]>(() => (model.value?.length ? model.value : [{ url: '', note: '' }]))
const canAdd = computed(() => rows.value.length < MAX && !!rows.value.at(-1)?.url?.trim())

function update(index: number, patch: Partial<BriefLinkRow>) {
  model.value = rows.value.map((row, i) => (i === index ? { ...row, ...patch } : row))
}

async function add() {
  added.value = true
  model.value = [...rows.value, { url: '', note: '' }]

  await nextTick()
  frame([...(list.value?.querySelectorAll('[data-brief-row]') ?? [])].at(-1))
}

// Ends a leave as it starts, so Vue drops the row this frame instead of waiting for a transition
const removeAtOnce = (_el: Element, done: () => void) => done()

function remove(index: number) {
  model.value = rows.value.filter((_, i) => i !== index)
}

// Pasting several links at once fills a row each. They take the place of the row pasted into, alongside the other
// rows with links in them, and stop at MAX rather than pushing any of those out.
function onPaste(index: number, event: ClipboardEvent) {
  const urls = (event.clipboardData?.getData('text') ?? '').split(/[\s,]+/).filter((part) => part.includes('.'))
  if (urls.length < 2) return

  event.preventDefault()
  const filled = (row: BriefLinkRow) => !!row.url?.trim()
  const before = rows.value.slice(0, index).filter(filled)
  const after = rows.value.slice(index + 1).filter(filled)
  const pasted = urls.slice(0, MAX - before.length - after.length).map((url) => ({ url, note: '' }))
  model.value = [...before, ...pasted, ...after]
}
</script>

<template>
  <div
    ref="list"
    class="flex flex-col gap-3"
  >
    <!-- New rows rise in. Removed ones go at once: rows are keyed by position, so a middle row fading out would
         show its old link while the row taking its place already shows the next one. -->
    <TransitionGroup
      name="brief-reveal"
      @leave="removeAtOnce"
    >
      <BriefLinkInput
        v-for="(row, index) in rows"
        :key="index"
        :url="row.url ?? ''"
        :note="row.note ?? ''"
        data-brief-row
        :index="index"
        :url-errors="rowErrors[index]?.url"
        :note-errors="rowErrors[index]?.note"
        :placeholders="placeholders"
        :note-placeholder="notePlaceholder"
        :sharing-nudge="sharingNudge"
        :focus-on-mount="(index === 0 && focusOnMount) || added"
        :removable="rows.length > 1"
        @update:url="update(index, { url: $event })"
        @update:note="update(index, { note: $event })"
        @paste="onPaste(index, $event)"
        @remove="remove(index)"
        @submit="emit('submit')"
      />
    </TransitionGroup>

    <Transition name="brief-reveal">
      <button
        v-if="canAdd"
        type="button"
        class="self-start text-16 text-beige underline underline-offset-4 only-hover:hover:text-white"
        @click="add"
      >
        + Add another link
      </button>
    </Transition>
  </div>
</template>
