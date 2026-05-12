<script lang="ts" setup>
import type { Page } from '#storyblok-components'
import type { ISbStoryData } from '@storyblok/js'

interface Props {
  story: ISbStoryData<Page>
}

const { story } = defineProps<Props>()
</script>

<template>
  <BlockHero />

  <section
    v-for="block in story.content.blocks"
    :key="block._uid"
    :id="block?.id"
    :class="['theme' in block ? themeClasses[block.theme as Themes] : '']"
  >
    <BlockCta
      v-if="block.component === 'block_cta'"
      :block="block"
    />

    <BlockServices
      v-else-if="block.component === 'block_services'"
      :block="block"
    />

    <BlockStatement
      v-else-if="block.component === 'block_statement'"
      :block="block"
    />

    <BlockSteps
      v-else-if="block.component === 'block_steps'"
      :block="block"
    />

    <BlockTeam
      v-else-if="block.component === 'block_team'"
      :block="block"
    />

    <BlockProjects
      v-else-if="block.component === 'block_projects'"
      :block="block"
    />
  </section>
</template>
