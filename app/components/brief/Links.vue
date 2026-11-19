<script lang="ts" setup>
import type { BriefLinkRow } from '@/utils/brief'

const MAX = 3

interface Props {
  rowErrors?: string[][]
}

const { rowErrors = [] } = defineProps<Props>()
const model = defineModel<BriefLinkRow[] | undefined>()
const emit = defineEmits<{ submit: [] }>()

const id = useId()
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

// Pasting several links at once fills a row each, up to MAX
function onPaste(index: number, event: ClipboardEvent) {
  const urls = (event.clipboardData?.getData('text') ?? '').split(/[\s,]+/).filter((part) => part.includes('.'))
  if (urls.length < 2) return

  event.preventDefault()
  const pasted = urls.map((url) => ({ url, note: '' }))
  model.value = [...rows.value.slice(0, index), ...pasted].slice(0, MAX)
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
      <div
        v-for="(row, index) in rows"
        :key="index"
        data-brief-row
        class="flex flex-col gap-1.5"
      >
        <div class="flex items-center gap-2">
          <BriefTextInput
            :model-value="row.url ?? ''"
            type="url"
            inputmode="url"
            placeholder="acme.com"
            :aria-label="`Link ${index + 1}`"
            :aria-invalid="rowErrors[index]?.length ? true : undefined"
            :aria-describedby="rowErrors[index]?.length ? `${id}-${index}` : undefined"
            :focus-on-mount="index === 0 || added"
            @update:model-value="update(index, { url: $event })"
            @paste="onPaste(index, $event)"
            @submit="emit('submit')"
          />

          <button
            v-if="rows.length > 1"
            type="button"
            class="shrink-0 px-2 text-28 leading-none opacity-50 only-hover:hover:opacity-100"
            :aria-label="`Remove link ${index + 1}`"
            @click="remove(index)"
          >
            ×
          </button>
        </div>

        <BriefFieldError
          :id="`${id}-${index}`"
          :errors="rowErrors[index]"
        />

        <Transition name="brief-reveal">
          <BriefTextInput
            v-if="row.url?.trim()"
            :model-value="row.note ?? ''"
            placeholder="What do you like about it? (optional)"
            :aria-label="`Note for link ${index + 1}`"
            small
            @update:model-value="update(index, { note: $event })"
            @submit="emit('submit')"
          />
        </Transition>
      </div>
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
