<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { Page } from '#storyblok-components'
import type { ISbStoryData } from '@storyblok/js'

interface Props {
  story: ISbStoryData<Page>
}

const { story } = defineProps<Props>()

const scrollTheme = useBlockTheme()

onUnmounted(() => {
  scrollTheme.value = null
})
</script>

<template>
  <UiTheme
    v-for="block in story.content.blocks"
    :key="block._uid"
    :id="block?.id"
    :theme="'theme' in block ? (block.theme as Themes) : undefined"
  >
    <BlockCta
      v-if="block.component === 'block_cta'"
      :block="block"
    />

    <BlockHero
      v-else-if="block.component === 'block_hero'"
      :block="block"
    />

    <BlockProjects
      v-else-if="block.component === 'block_projects'"
      :block="block"
    />

    <BlockStatement
      v-else-if="block.component === 'block_statement'"
      :block="block"
    />

    <BlockServices
      v-else-if="block.component === 'block_services'"
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
  </UiTheme>
</template>
