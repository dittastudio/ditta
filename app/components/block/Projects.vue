<script lang="ts" setup>
import type { BlockProjects } from '#storyblok-components'

interface Props {
  block: BlockProjects
}

const { block } = defineProps<Props>()

const projects = computed(() => block.projects?.filter((project) => typeof project !== 'string') || [])

const rotations = computed(() =>
  projects.value.map((_, index) => {
    const sign = index % 2 === 0 ? -1 : 1
    return {
      '--deg-from': `${Math.round(sign * 6 * Math.random() * 5)}deg`,
      '--deg-to': `${Math.round(-sign * Math.random() * 5)}deg`,
      '--translate-from': `${Math.round(sign * Math.random() * 25)}% 50% 0`,
    }
  }),
)
</script>

<template>
  <div
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <UiTicker
      v-if="block.ticker"
      spacing-classes="gap-10 px-5"
    >
      <template
        v-for="i in 4"
        :key="i"
      >
        <div class="project__ticker text-display">
          {{ block.ticker }}
        </div>

        <div
          aria-hidden="true"
          class="project__ticker text-display"
        >
          &mdash;
        </div>
      </template>
    </UiTicker>

    <div class="wrapper grid grid-cols-1 md:grid-cols-12 gap-(--app-gutter-inner)">
      <ul class="col-span-1 md:col-start-2 md:col-span-10">
        <li
          v-for="(project, index) in projects"
          :key="`${project.uuid}-${index}`"
          class="sticky top-0 h-screen w-full flex flex-col items-center py-10"
        >
          <NuxtLink
            :to="`/${project.full_slug}`"
            class="project__item flex flex-col justify-center max-w-full h-full aspect-video"
            :style="rotations[index]"
          >
            <UiCardWork
              :title="project.content.title"
              :image="project.content.media"
            />
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.project__ticker {
  font-size: utopia.clamp(120, 160);
}

.project__item {
  animation: project-in var(--ease-out) both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

@keyframes project-in {
  0% {
    rotate: var(--deg-from);
    translate: var(--translate-from);
  }
  100% {
    rotate: var(--deg-to);
    translate: 0 0 0;
  }
}
</style>
