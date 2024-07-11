<script lang="ts" setup>
import type { PageStoryblok } from '@/types/storyblok'

interface Props {
  content: PageStoryblok
}

const { content } = defineProps<Props>()
</script>

<template>
  <div>
    <section
      v-for="block in content.blocks"
      :key="block._uid"
    >
      <BlockBentoBox
        v-if="block.component === 'block_bento_box' && !block.hidden"
        :block="block"
      />

      <BlockHeroText
        v-else-if="block.component === 'block_hero_text' && !block.hidden"
        :block="block"
      />

      <BlockHeroWork
        v-else-if="block.component === 'block_hero_work' && !block.hidden"
        :block="block"
      />

      <BlockMarquees
        v-else-if="block.component === 'block_marquees' && !block.hidden"
        :block="block"
      />

      <BlockMedia
        v-else-if="block.component === 'block_media' && !block.hidden"
        :block="block"
      />

      <BlockServices
        v-else-if="block.component === 'block_services' && !block.hidden"
        :block="block"
      />

      <BlockStudios
        v-else-if="block.component === 'block_studios' && !block.hidden"
        :block="block"
      />
    </section>
  </div>
</template>
