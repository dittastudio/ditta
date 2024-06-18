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
        v-if="block.component === 'block_bento_box'"
        :block="block"
      />

      <BlockMedia
        v-else-if="block.component === 'block_media'"
        :block="block"
      />

      <BlockText
        v-else-if="block.component === 'block_text'"
        :block="block"
      />
    </section>
  </div>
</template>
