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
      <!-- <pre>{{ block.projects }}</pre> -->
      <ul>
        <li
          v-for="project in block.projects"
          :key="typeof project === 'string' ? project : project.uuid"
        >
          <NuxtImg
            v-if="
              typeof project !== 'string' &&
              project?.content?.media?.filename &&
              storyblokAssetType(project.content.media.filename) === 'image'
            "
            class="block w-full rounded-20"
            :src="project.content.media.filename"
            :alt="project.content.media.alt || project.content.title || ''"
            loading="lazy"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.ui-ticker__text {
  font-size: utopia.clamp(120, 160);
}
</style>
