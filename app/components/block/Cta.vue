<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { BlockCta } from '#storyblok-components'

interface Props {
  block: BlockCta
}

const { block } = defineProps<Props>()
</script>

<template>
  <div class="wrapper py-(--app-vertical-rhythm)">
    <p v-if="block.text">
      {{ block.text }}
    </p>

    <template
      v-for="cta in block.button"
      :key="cta._uid"
    >
      <StoryblokLink
        v-if="cta.link"
        :item="cta.link"
      >
        <UiButton
          :text="cta.text || ''"
          :theme="cta.theme as Themes | undefined"
        />
      </StoryblokLink>
    </template>
  </div>
</template>
