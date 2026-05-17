<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { Project } from '#storyblok-components'
import type { ISbStoryData } from '@storyblok/js'

interface Props {
  story: ISbStoryData<Project>
}

const { story } = defineProps<Props>()

const services = await useDatasource('services', story.content.services)
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

    <BlockProjects
      v-else-if="block.component === 'block_projects'"
      :block="block"
    />

    <BlockProjectOverview
      v-else-if="block.component === 'block_project_overview'"
      :block="block"
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
    </BlockProjectOverview>

    <BlockMedia
      v-else-if="block.component === 'block_media'"
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
