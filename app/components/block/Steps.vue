<script lang="ts" setup>
import type { BlockSteps } from '#storyblok-components'
import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'

interface Props {
  block: BlockSteps
}

const { block } = defineProps<Props>()

const rotation = ref(0)

const onMouseMove = (event: MouseEvent) => {
  rotation.value = (event.clientX / window.innerWidth) * 80 - 40
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <div
    v-editable="block"
    class="wrapper flex flex-col gap-[calc(var(--app-gutter-outer)*2)] md:gap-(--app-gutter-outer)"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
      <UiLockup
        class="col-span-full md:col-span-8"
        :heading="block.heading"
        :copy="block.copy"
      />

      <div class="col-span-full md:col-span-4">
        <IconPixelArrow
          class="arrow w-30 md:w-40 ml-auto"
          :style="{ transform: `rotate(${rotation}deg)` }"
        />
      </div>
    </div>

    <div class="flex flex-col gap-1 rounded-20 squircle-40 overflow-hidden -mx-(--app-gutter-outer) md:-mx-15">
      <div
        v-for="step in block.steps"
        v-editable="step"
        :key="step._uid"
        class="bg-white px-(--app-gutter-outer) py-10 md:px-15 md:py-20 transition-all duration-250 ease-outCubic hover:invert-100"
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

<style scoped>
@keyframes float {
  0% {
    translate: 0 0;
  }
  50% {
    translate: 0 30px;
  }
  100% {
    translate: 0 0;
  }
}

.arrow {
  animation: float 3s ease-in-out infinite;
}
</style>
