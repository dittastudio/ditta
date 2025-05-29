<script lang="ts" setup>
import type { SettingsStoryblok } from '@@/types/storyblok'
import IconDitta from '@/assets/icons/ditta.svg'

const settings = await useStory('/settings')
const content = settings.value.content as SettingsStoryblok
</script>

<template>
  <div class="flex flex-col items-start justify-between min-h-screen">
    <UiTicker
      :copy="['Say Hello']"
      duration="65s"
      direction="right"
      is-last
    />

    <div class="wrapper py-[var(--app-outer-gutter)]">
      <div
        v-if="content"
        class="prose mb-16 [&_p]:max-w-[40ch]"
      >
        <StoryblokText :html="content.footer_copy" />
      </div>

      <IconDitta class="block w-10 h-3.5 mb-4" />

      <p class="text-10 font-bold max-w-[40ch] text-balance opacity-20">
        ditta ltd. is a company registered in England and Wales with company number 15648076.
      </p>
    </div>
  </div>
</template>
