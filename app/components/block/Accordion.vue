<script lang="ts" setup>
import type { BlockAccordion } from '#storyblok-components'

interface Props {
  block: BlockAccordion
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="wrapper flex flex-col gap-(--app-gutter-outer) overflow-clip items-center"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div class="w-full max-w-174">
      <UiLockup
        :heading="block.heading"
        :copy="block.copy"
      />

      <div class="w-full grid gap-1 rounded-20 overflow-hidden">
        <template
          v-for="item in block.items"
          v-editable="item"
          :key="item._uid"
        >
          <UiAccordionItem
            v-if="item.heading && storyblokRichTextContent(item.copy)"
            :heading="item.heading"
            :copy="item.copy"
          />
        </template>
      </div>
    </div>
  </div>
</template>
