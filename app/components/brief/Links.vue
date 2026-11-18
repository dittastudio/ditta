<script lang="ts" setup>
import type { BriefLink } from '@/utils/brief'

const MAX = 3

const model = defineModel<BriefLink[] | undefined>()
const emit = defineEmits<{ submit: [] }>()

// Always at least one row to type into
const rows = computed<BriefLink[]>(() => (model.value?.length ? model.value : [{ url: '', note: '' }]))
const canAdd = computed(() => rows.value.length < MAX && !!rows.value.at(-1)?.url.trim())

function update(index: number, patch: Partial<BriefLink>) {
  model.value = rows.value.map((row, i) => (i === index ? { ...row, ...patch } : row))
}

function add() {
  model.value = [...rows.value, { url: '', note: '' }]
}

function remove(index: number) {
  model.value = rows.value.filter((_, i) => i !== index)
}

// Pasting several links at once fills a row each, up to MAX
function onPaste(index: number, event: ClipboardEvent) {
  const urls = (event.clipboardData?.getData('text') ?? '').split(/[\s,]+/).filter((part) => part.includes('.'))
  if (urls.length < 2) return

  event.preventDefault()
  const before = rows.value.slice(0, index)
  const pasted = urls.map((url) => ({ url, note: '' }))
  model.value = [...before, ...pasted].slice(0, MAX)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="flex flex-col gap-1.5"
    >
      <div class="flex items-center gap-2">
        <BriefTextInput
          :model-value="row.url"
          type="url"
          placeholder="https://"
          :label="`Link ${index + 1}`"
          :autofocus="index === 0"
          @update:model-value="update(index, { url: $event })"
          @paste="onPaste(index, $event)"
          @submit="emit('submit')"
        />

        <button
          v-if="rows.length > 1"
          type="button"
          class="shrink-0 px-2 text-20 leading-none opacity-50 only-hover:hover:opacity-100"
          :aria-label="`Remove link ${index + 1}`"
          @click="remove(index)"
        >
          ×
        </button>
      </div>

      <BriefTextInput
        v-if="row.url.trim()"
        :model-value="row.note"
        placeholder="What do you like about it? (optional)"
        :label="`Note for link ${index + 1}`"
        small
        @update:model-value="update(index, { note: $event })"
        @submit="emit('submit')"
      />
    </div>

    <button
      v-if="canAdd"
      type="button"
      class="self-start text-14 font-medium underline underline-offset-4"
      @click="add"
    >
      + Add another link
    </button>
  </div>
</template>
