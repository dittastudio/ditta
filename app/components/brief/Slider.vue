<script lang="ts" setup>
// Attributes (aria-labelledby, aria-describedby) belong on the range input, not the wrapper
defineOptions({ inheritAttrs: false })

interface Props {
  options: readonly string[]
}

const { options } = defineProps<Props>()
const model = defineModel<string | undefined>()

// Starts with nothing chosen, so the answer is one someone actually picked rather than wherever the handle began (see
// docs/plans/brief-builder-flow.md, screen 8)
const chosen = computed(() => (model.value && options.includes(model.value) ? options.indexOf(model.value) : -1))

const index = computed({
  get: () => Math.max(chosen.value, 0),
  set: (value: number) => {
    model.value = options[value]
  },
})

// A native range always holds a value, so a tap on the handle where it already sits fires no input event. Count it as
// a choice anyway.
function commit(event: Event) {
  if (chosen.value === -1) index.value = Number((event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <p
      class="text-40 leading-none trim-both md:text-64"
      :class="{ 'text-beige': chosen === -1 }"
      aria-hidden="true"
    >
      {{ chosen === -1 ? 'Drag to choose' : options[index] }}
    </p>

    <input
      v-bind="$attrs"
      v-model.number="index"
      type="range"
      min="0"
      :max="options.length - 1"
      step="1"
      :aria-valuetext="chosen === -1 ? 'Not chosen yet' : options[index]"
      class="w-full accent-coral transition-opacity"
      :class="{ 'opacity-40': chosen === -1 }"
      @pointerup="commit"
      @keyup="commit"
    />

    <div class="flex justify-between gap-1">
      <button
        v-for="(option, i) in options"
        :key="option"
        type="button"
        tabindex="-1"
        class="text-14 leading-tight transition-opacity"
        :class="[
          i === chosen ? 'font-medium opacity-100' : 'opacity-50',
          i === 0 ? 'text-left' : i === options.length - 1 ? 'text-right' : 'text-center',
        ]"
        @click="index = i"
      >
        {{ option }}
      </button>
    </div>
  </div>
</template>
