<script lang="ts" setup>
// Attributes (aria-labelledby, aria-describedby) belong on the range input, not the wrapper
defineOptions({ inheritAttrs: false })

interface Props {
  options: readonly string[]
}

const { options } = defineProps<Props>()
const model = defineModel<string | undefined>()

// Starts on the first point, so it always has an answer (see docs/plans/brief-builder-flow.md, screen 8)
onMounted(() => {
  if (!model.value || !options.includes(model.value)) model.value = options[0]
})

const index = computed({
  get: () => Math.max(options.indexOf(model.value ?? ''), 0),
  set: (value: number) => {
    model.value = options[value]
  },
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <p
      class="text-40 leading-none trim-both md:text-64"
      aria-hidden="true"
    >
      {{ options[index] }}
    </p>

    <input
      v-bind="$attrs"
      v-model.number="index"
      type="range"
      min="0"
      :max="options.length - 1"
      step="1"
      :aria-valuetext="options[index]"
      class="w-full accent-coral"
    />

    <div class="flex justify-between gap-1">
      <button
        v-for="(option, i) in options"
        :key="option"
        type="button"
        tabindex="-1"
        class="text-14 leading-tight transition-opacity"
        :class="[
          i === index ? 'font-medium opacity-100' : 'opacity-50',
          i === 0 ? 'text-left' : i === options.length - 1 ? 'text-right' : 'text-center',
        ]"
        @click="index = i"
      >
        {{ option }}
      </button>
    </div>
  </div>
</template>
