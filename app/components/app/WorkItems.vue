<script lang="ts" setup>
import type { PageStoryblok } from '@@/types/storyblok'

interface Props {
  content: PageStoryblok
}

const { content } = defineProps<Props>()
</script>

<template>
  <section
    v-for="(work_item, index) in content.work_items"
    :key="work_item._uid"
  >
    <BlockWork
      v-if="work_item.component === 'block_work'"
      :index="index"
      :block="work_item"
    />
  </section>
</template>
