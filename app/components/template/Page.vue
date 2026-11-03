<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { Block } from '#storyblok-schema'
import type { ISbStoryData } from '@storyblok/js'

interface Props {
  story: ISbStoryData<Block<'page'>>
}

const { story } = defineProps<Props>()
</script>

<template>
  <UiTheme
    v-for="block in story.content.blocks"
    :key="block._uid"
    :id="block?.id"
    :theme="'theme' in block ? (block.theme as Themes) : undefined"
  >
    <!-- <BlockCompanies
      v-if="block.component === 'block_companies'"
      :block="block"
    /> -->

    <LazyBlockAccordion
      v-if="block.component === 'block_accordion'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockCta
      v-else-if="block.component === 'block_cta'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockHero
      v-else-if="block.component === 'block_hero'"
      :block="block"
    />

    <LazyBlockPosts
      v-else-if="block.component === 'block_posts'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockProjects
      v-else-if="block.component === 'block_projects'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockStatement
      v-else-if="block.component === 'block_statement'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockServices
      v-else-if="block.component === 'block_services'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockTeam
      v-else-if="block.component === 'block_team'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockSteps
      v-else-if="block.component === 'block_steps'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />
  </UiTheme>
</template>
