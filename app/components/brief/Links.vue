<script lang="ts" setup>
import type { BriefLinkRow, BriefLinkRowErrors } from '#shared/utils/brief'

interface Props {
  rowErrors?: BriefLinkRowErrors[]
  // Examples for the link field, shown in turn while it's empty. The first is the native placeholder.
  placeholders?: readonly string[]
  notePlaceholder?: string
  // A reminder under links from hosts where files are private until shared
  sharingNudge?: boolean
  // The first row takes focus as it mounts
  focusOnMount?: boolean
  // How many rows can be added
  // How many rows can be added (see briefLinkLimits)
  max: number
}

const {
  rowErrors = [],
  placeholders = ['acme.com'],
  notePlaceholder = 'What do you like about it? (optional)',
  sharingNudge = false,
  focusOnMount = false,
  max,
} = defineProps<Props>()
const model = defineModel<BriefLinkRow[] | undefined>()
const emit = defineEmits<{ submit: [] }>()

// A row added by hand takes focus and comes into view; the rows already there on load leave focus to the first
const added = ref(false)

// Always at least one row to type into
const rows = computed<BriefLinkRow[]>(() => (model.value?.length ? model.value : [{ url: '', note: '' }]))
const canAdd = computed(() => rows.value.length < max)

// A key for each row that stays with it as rows come and go, so a row taken out of the middle is the one that closes
// rather than the last. Kept here, alongside the rows, rather than saved with the answers. Rows that arrive some other
// way (a saved draft loading, the brief being cleared) get fresh keys.
let nextKey = 0
const keys = ref<number[]>([])
watch(
  () => rows.value.length,
  (length) => {
    if (keys.value.length !== length) keys.value = Array.from({ length }, () => nextKey++)
  },
  { immediate: true },
)

function update(index: number, patch: Partial<BriefLinkRow>) {
  model.value = rows.value.map((row, i) => (i === index ? { ...row, ...patch } : row))
}

function add() {
  added.value = true
  keys.value = [...keys.value, nextKey++]
  model.value = [...rows.value, { url: '', note: '' }]
}

function remove(index: number) {
  keys.value = keys.value.filter((_, i) => i !== index)
  model.value = rows.value.filter((_, i) => i !== index)
}

// Pasting several links at once fills a row each. They take the place of the row pasted into, alongside the other
// rows with links in them, and stop at `max` rather than pushing any of those out.
function onPaste(index: number, event: ClipboardEvent) {
  const urls = (event.clipboardData?.getData('text') ?? '').split(/[\s,]+/).filter((part) => part.includes('.'))
  if (urls.length < 2) return

  event.preventDefault()
  // Each row with its key, so the two are kept and dropped together
  const paired = rows.value.map((row, i) => ({ row, key: keys.value[i] ?? nextKey++ }))
  const filled = ({ row }: { row: BriefLinkRow }) => !!row.url?.trim()
  const before = paired.slice(0, index).filter(filled)
  const after = paired.slice(index + 1).filter(filled)
  // The row pasted into keeps its key for the first link, so it fills in place rather than closing and reopening
  const pasted = urls
    .slice(0, max - before.length - after.length)
    .map((url, i) => ({ row: { url, note: '' }, key: i === 0 ? paired[index]!.key : nextKey++ }))
  const next = [...before, ...pasted, ...after]
  keys.value = next.map(({ key }) => key)
  model.value = next.map(({ row }) => row)
}
</script>

<template>
  <div class="-mt-3 flex flex-col">
    <TransitionGroup name="brief-open">
      <div
        v-for="(row, index) in rows"
        :key="keys[index] ?? `row-${index}`"
        class="grid"
      >
        <div class="min-h-0">
          <BriefLinkInput
            :url="row.url ?? ''"
            :note="row.note ?? ''"
            class="pt-3"
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
        </div>
      </div>
    </TransitionGroup>

    <Transition name="brief-open">
      <div
        v-if="canAdd"
        class="grid"
      >
        <div class="min-h-0">
          <div class="pt-5">
            <button
              type="button"
              class="text-subheading font-regular opacity-60 transition-opacity duration-hover ease-outCubic only-hover:hover:opacity-100"
              @click="add"
            >
              + Add another link
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
