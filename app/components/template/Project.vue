<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { Block } from '#storyblok-schema'
import type { ISbStoryData } from '@storyblok/js'

interface Props {
  story: ISbStoryData<Block<'project'>>
}

const { story } = defineProps<Props>()

const services = await useDatasource('services', story.content.services)
</script>

<template>
  <UiTheme
    v-for="block in story.content.blocks"
    :key="block._uid"
    :theme="'theme' in block ? (block.theme as Themes) : undefined"
  >
    <LazyBlockHeroProject
      v-if="block.component === 'block_hero_project'"
      :block="block"
    />

    <LazyBlockCta
      v-else-if="block.component === 'block_cta'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockStatement
      v-else-if="block.component === 'block_statement'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockProjects
      v-else-if="block.component === 'block_projects'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockProjectOverview
      v-else-if="block.component === 'block_project_overview'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    >
      <ul class="flex gap-2.5 flex-wrap max-w-[40em]">
        <li
          v-for="service in services"
          :key="service.id"
        >
          <UiChip
            :text="service.name"
            size="medium"
            theme="light"
          />
        </li>
      </ul>
    </LazyBlockProjectOverview>

    <LazyBlockMedia
      v-else-if="block.component === 'block_media'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockTestimonial
      v-else-if="block.component === 'block_testimonial'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />

    <LazyBlockText
      v-else-if="block.component === 'block_text'"
      :block="block"
      :hydrate-on-visible="HYDRATE_NEARBY"
    />
  </UiTheme>
</template>
