<script lang="ts" setup>
import type { BlockHeroWorkStoryblok } from '@/types/storyblok'

interface Props {
  block: BlockHeroWorkStoryblok
}

const { block } = defineProps<Props>()
const classes = computed(() => [colourText[block.colour], colourBackground[block.background]])
</script>

<template>
  <div
    v-editable="block"
    :class="classes"
  >
    <div class="section wrapper md:grid md:grid-cols-12 md:gap-20">
      <div class="md:col-span-8 md:col-start-3 flex flex-col gap-10">
        <p
          v-if="block.title"
          class="text-20"
        >
          Work / {{ block.title }}
        </p>

        <h1
          v-if="block.headline"
          class="text-65 text-balance"
        >
          {{ block.headline }}
        </h1>
      </div>
    </div>
  </div>
</template>
