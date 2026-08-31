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
    <div class="w-full max-w-174 flex flex-col gap-20">
      <div
        v-if="block.heading || storyblokRichTextContent(block.copy)"
        class="prose prose-p:text-pretty prose-p:text-lead text-center"
      >
        <h2
          v-if="block.heading"
          class="text-title whitespace-pre-wrap trim-both"
        >
          {{ block.heading }}
        </h2>

        <StoryblokText
          v-if="storyblokRichTextContent(block.copy)"
          :html="block.copy"
        />
      </div>

      <div class="w-full grid gap-1 rounded-20 overflow-hidden">
        <template
          v-for="item in block.items"
          :key="item._uid"
        >
          <UiAccordionItem
            v-if="item.heading && storyblokRichTextContent(item.copy)"
            v-editable="item"
            :heading="item.heading"
            :copy="item.copy"
          />
        </template>
      </div>
    </div>
  </div>
</template>
