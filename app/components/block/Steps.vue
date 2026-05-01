<script lang="ts" setup>
import type { BlockSteps } from '#storyblok-components'

interface Props {
  block: BlockSteps
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    class="wrapper flex flex-col gap-[calc(var(--app-gutter-outer)*2)] md:gap-(--app-gutter-outer)"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <UiLockup
      :heading="block.heading"
      :copy="block.copy"
    />

    <div class="flex flex-col gap-1 rounded-2xl overflow-hidden -mx-(--app-gutter-outer) md:-mx-15">
      <div
        v-for="step in block.steps"
        :key="step._uid"
        class="bg-white px-(--app-gutter-outer) py-10 md:px-15 md:py-20"
      >
        <UiStep
          :title="step.title"
          :heading="step.heading"
          :copy="step.copy"
        />
      </div>
    </div>
  </div>
</template>
