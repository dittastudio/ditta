<script lang="ts" setup>
import type { BlockProjects } from '#storyblok-components'

interface Props {
  block: BlockProjects
}

const { block } = defineProps<Props>()
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
        <div class="ui-ticker__text text-display">
          {{ block.ticker }}
        </div>

        <div
          aria-hidden="true"
          class="ui-ticker__text text-display"
        >
          &mdash;
        </div>
      </template>
    </UiTicker>

    <div>
      <div>
        <h1>Projects</h1>

        <pre>{{ block.projects }}</pre>
        <!-- <ul>
          <li v-for="project in block.projects" :key="project.id">
            <NuxtLink :to="project._path">
              {{ project.title }}
            </NuxtLink>
          </li>
        </ul> -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-ticker__text {
  font-size: utopia.clamp(120, 160);
}
</style>
