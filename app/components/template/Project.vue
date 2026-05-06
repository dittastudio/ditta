<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { Project } from '#storyblok-components'
import type { ISbStoryData } from '@storyblok/js'

interface Props {
  story: ISbStoryData<Project>
}

const { story } = defineProps<Props>()
</script>

<template>
  <section
    v-for="block in story.content.blocks"
    :key="block._uid"
    :class="['theme' in block ? themeClasses[block.theme as Themes] : '']"
  >
    <BlockHeroProject
      v-if="block.component === 'block_hero_project'"
      :block="block"
    />

    <BlockCta
      v-else-if="block.component === 'block_cta'"
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

    <BlockMedia
      v-else-if="block.component === 'block_media'"
      :block="block"
    />

    <BlockServices
      v-else-if="block.component === 'block_services'"
      :block="block"
    />

    <BlockTestimonial
      v-else-if="block.component === 'block_testimonial'"
      :block="block"
    />

    <BlockText
      v-else-if="block.component === 'block_text'"
      :block="block"
    />
  </section>
</template>
