<script lang="ts" setup>
import type { BentoMusicStoryblok } from '@/types/storyblok'

interface Props {
  block: BentoMusicStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="bg-orange w-full h-full p-20"
  >
    <ElementSpeaker class="size-full" />
  </div>
</template>
