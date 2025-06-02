<script lang="ts" setup>
import type { PageStoryblok } from '@@/types/storyblok'

interface Props {
  content: PageStoryblok
}

const { content } = defineProps<Props>()
</script>

<template>
  <div>
    <section
      v-for="(block) in content.blocks"
      :key="block._uid"
      class="content-blocks__item"
      :class="[
        `content-blocks__item--${block.component}`,
      ]"
    >
      <BlockImage
        v-if="block.component === 'block_image'"
        :block="block"
      />

      <BlockText
        v-else-if="block.component === 'block_text'"
        :block="block"
      />

      <BlockMarquees
        v-else-if="block.component === 'block_marquees'"
        :block="block"
      />
    </section>
  </div>
</template>

<!-- <style lang="postcss" scoped>
.content-blocks__item:not(
  .content-blocks__item--block_image,
  .content-blocks__item--block_video,
  .content-blocks__item--block_split,
  .content-blocks__item--block_carousel
) {
  padding-block: 160px;
}

.content-blocks__item:not([class*="bg-"]) + .content-blocks__item.bg-offblack,
.content-blocks__item.bg-offblack + .content-blocks__item:not([class*="bg-"]),
.content-blocks__item--same-background {
  padding-block-start: 0;
}
</style> -->
