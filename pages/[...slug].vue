<script lang="ts" setup>
import type { PageStoryblok } from '@/types/storyblok'

const route = useRoute()
const story = await useStoryblokStory<PageStoryblok>(route.path)

useStoryblokSetup<PageStoryblok>(story)

const headings = [
  {
    backgroundColor: 'offblack',
    textColor: 'pink',
    copy: ['Hire us'],
    duration: '60s',
  },
  {
    backgroundColor: 'pink',
    textColor: 'offblack',
    copy: ['Sleep'],
    duration: '80s',
  },
  {
    backgroundColor: 'offwhite',
    textColor: 'offblack',
    copy: ['Wake up'],
    duration: '70s',
  },
  {
    backgroundColor: 'offblack',
    textColor: 'offwhite',
    copy: ['Pay up'],
    duration: '65s',
  },
  {
    backgroundColor: 'pink',
    textColor: 'offblack',
    copy: ['Repeat'],
    duration: '85s',
  },
]
</script>

<template>
  <div>
    <BlockComponents
      v-if="story"
      :content="story.content"
    />

    <ElementMarquee
      v-for="(heading, index) in headings"
      :key="index"
      :background-color="heading.backgroundColor"
      :text-color="heading.textColor"
      :copy="heading.copy"
      :duration="heading.duration"
      :direction="index % 2 ? 'right' : 'left'"
    />
  </div>
</template>
