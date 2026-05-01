<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { Page } from '#storyblok-components'
import type { ISbStoryData } from '@storyblok/js'

interface Props {
  story: ISbStoryData<Page>
}

const { story } = defineProps<Props>()
</script>

<template>
  <section
    v-for="block in story.content.blocks"
    :key="block._uid"
    :class="['theme' in block ? themeClasses[block.theme as Themes] : '']"
  >
    <BlockStatement
      v-if="block.component === 'block_statement'"
      :block="block"
    />

    <BlockChips
      v-else-if="block.component === 'block_chips'"
      :block="block"
    />

    <BlockSteps
      v-else-if="block.component === 'block_steps'"
      :block="block"
    />
  </section>
</template>
