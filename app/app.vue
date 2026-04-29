<script setup lang="ts">
import type { Settings } from '#storyblok-components'
import IconLogo from '@/assets/icons/ditta.svg'

const story = await useStory<Settings>('/settings')
const route = useRoute()

const globalClasses = computed(() => ({
  'is-storyblok-editor': storyblokEditor(route.query),
}))

useHead({
  htmlAttrs: {
    class: globalClasses,
  },
})

useSeoMeta({
  titleTemplate: (title) => (title ? `${title} - ditta` : 'ditta'),
  robots: 'index, follow',
})

const bgColours = [
  'bg-white',
  'bg-black',
  'bg-pink',
  'bg-beige',
  'bg-grey',
  'bg-olive',
  'bg-forest',
  'bg-mood',
  'bg-crema',
]
</script>

<template>
  <div>
    <div class="flex items-center justify-center">
      <div class="text-xl">Ditta</div>

      <IconLogo class="ml-2 h-6 w-auto" />
    </div>

    <ul class="wrapper flex flex-wrap gap-5">
      <li
        v-for="bgColour in bgColours"
        :class="bgColour"
        class="aspect-square w-30 rounded-sm"
      >
        {{ bgColour }}
      </li>
    </ul>

    <NuxtPage />

    <AppFooter :text="story.content.footer_copy_v2" />

    <!-- <pre> {{ story }} </pre> -->
  </div>
</template>
