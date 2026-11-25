<script lang="ts" setup>
import IconClose from '@/assets/icons/close.svg'

// One link row: the link, and once it has one, a note joined on underneath. The two read as a single box, square
// where they meet. Each keeps its own errors, stacked under the pair (a message can't sit between joined fields).

interface Props {
  // 0-based, for the fields' labels
  index: number
  urlErrors?: string[]
  noteErrors?: string[]
  // Examples for the link field, shown in turn while it's empty. The first is the native placeholder.
  placeholders?: readonly string[]
  notePlaceholder?: string
  // A reminder under links from hosts where files are private until shared
  sharingNudge?: boolean
  focusOnMount?: boolean
  // Shows the remove button inside the link field
  removable?: boolean
}

const {
  index,
  urlErrors = [],
  noteErrors = [],
  placeholders = [],
  notePlaceholder,
  sharingNudge = false,
  focusOnMount = false,
  removable = false,
} = defineProps<Props>()
const url = defineModel<string>('url', { default: '' })
const note = defineModel<string>('note', { default: '' })
const emit = defineEmits<{ submit: []; remove: []; paste: [event: ClipboardEvent] }>()

const urlErrorId = useId()
const noteErrorId = useId()
const hasNote = computed(() => !!url.value.trim())

// Where the two share a line, it takes the colour of the field that matters most: the one being typed in, then one
// with an error, then one filled in (see TextInput's outline)
const layer =
  'relative grid has-[input:not(:placeholder-shown)]:z-1 has-aria-invalid:z-2 only-hover:hover:z-2 focus-within:z-3'
</script>

<template>
  <div class="flex flex-col gap-(--brief-error-gap) [--brief-error-gap:--spacing(1.5)]">
    <div class="flex flex-col">
      <div :class="layer">
        <BriefTextInput
          v-model="url"
          type="url"
          inputmode="url"
          :placeholder="placeholders[0]"
          :placeholders="placeholders"
          :join="hasNote ? 'top' : undefined"
          :aria-label="`Link ${index + 1}`"
          :aria-invalid="urlErrors.length ? true : undefined"
          :aria-describedby="urlErrors.length ? urlErrorId : undefined"
          :focus-on-mount="focusOnMount"
          @paste="emit('paste', $event)"
          @submit="emit('submit')"
        >
          <template
            v-if="removable"
            #end
          >
            <button
              type="button"
              class="group flex h-full touch-manipulation items-center pr-5 pl-3 text-white/60 transition-colors duration-hover ease-outCubic only-hover:hover:text-white"
              :aria-label="`Remove link ${index + 1}`"
              @click="emit('remove')"
            >
              <span
                class="grid size-6 place-items-center rounded-full bg-white/15 transition-colors duration-hover ease-outCubic only-hover:group-hover:bg-white/25"
              >
                <IconClose
                  class="size-3.5"
                  aria-hidden="true"
                />
              </span>
            </button>
          </template>
        </BriefTextInput>
      </div>

      <!-- Opens its own height and comes into focus as it does, so what's under it eases rather than jumps (see
           brief-open). Not clipped while it opens, which would wipe it in. The link's corners ease square and back
           alongside it (see TextInput's transition). Pulled up a pixel so the two share one border line. -->
      <Transition name="brief-open">
        <div
          v-if="hasNote"
          class="-mt-px grid"
        >
          <div class="min-h-0">
            <div :class="layer">
              <BriefTextInput
                v-model="note"
                join="bottom"
                :placeholder="notePlaceholder"
                :aria-label="`Note for link ${index + 1}`"
                :aria-invalid="noteErrors.length ? true : undefined"
                :aria-describedby="noteErrors.length ? noteErrorId : undefined"
                small
                @submit="emit('submit')"
              />
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <BriefFieldError
      :id="urlErrorId"
      :errors="urlErrors"
    />

    <BriefFieldError
      v-if="hasNote"
      :id="noteErrorId"
      :errors="noteErrors"
    />

    <Transition name="brief-reveal">
      <p
        v-if="sharingNudge && isPrivateByDefault(url)"
        class="text-14 opacity-60 md:text-16"
      >
        Check it's shared so anyone with the link can view.
      </p>
    </Transition>
  </div>
</template>
