<script lang="ts" setup>
import type { BentoNoticeStoryblok } from '@/types/storyblok'
import { storyblokRichTextContent } from '@/utilities/storyblok'

interface Props {
  block: BentoNoticeStoryblok
}

const { block } = defineProps<Props>()
const isOpen = useNowIsBetween('09:00', '18:00')

const classes = [
  'prose-headings:text-white',
  'prose-headings:mb-8',
  'prose-h1:text-50',
  'prose-h2:text-40',
  'prose-h3:text-24',
  'prose-h4:text-20',
  'prose-h5:text-18',
  'prose-h6:text-18',
  'prose-p:text-18',
  'prose-p:text-balance',
  'prose-p:opacity-50',
  'prose-p:mb-16',
  '@2xs:prose-h1:text-65',
  '@2xs:prose-h2:text-50',
  '@2xs:prose-h3:text-40',
  '@2xs:prose-h4:text-24',
  '@2xs:prose-h5:text-20',
]
</script>

<template>
  <div
    v-editable="block"
    class="@container w-full h-full flex flex-col p-20 bg-offblack text-white"
  >
    <StoryblokRichText
      v-if="storyblokRichTextContent(block.open_text) && isOpen"
      :content="block.open_text"
      :class="classes"
    />

    <StoryblokRichText
      v-else-if="storyblokRichTextContent(block.open_text) && !isOpen"
      :content="block.closed_text"
      :class="classes"
    />

    <p
      v-if="block.times"
      class="text-12"
    >
      {{ block.times }}
    </p>

    <ElementIndicator
      :on="isOpen"
      class="w-10/12 max-w-[180px] m-auto"
    />
  </div>
</template>
