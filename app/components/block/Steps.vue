<script lang="ts" setup>
import type { BlockSteps } from '#storyblok-components'

interface Props {
  block: BlockSteps
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    class="wrapper"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <UiLockup
      :heading="block.heading"
      :copy="block.copy"
    />

    <div class="flex flex-col gap-1 rounded-2xl overflow-hidden -mx-15">
      <div
        v-for="step in block.steps"
        :key="step._uid"
        class="bg-white p-15"
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
