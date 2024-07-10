<script lang="ts" setup>
import { storyblokRichTextContent } from '@/utilities/storyblok'
import { colourBackground, colourText } from '@/utilities/maps'
import type { BlockStudiosStoryblok } from '@/types/storyblok'

interface Props {
  block: BlockStudiosStoryblok
}

const { block } = defineProps<Props>()
const itemRefs = ref<HTMLElement[]>([])
const indexes = ref<number[]>([])
let observerItems: IntersectionObserver

const setIndex = (index: number) => {
  if (indexes.value.includes(index)) {
    return
  }

  indexes.value.push(index)
}

const callbackItems: IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => {
  entries.forEach((entry: IntersectionObserverEntry) => {
    const value = (entry.target as HTMLElement).dataset.index

    if (entry.isIntersecting && value) {
      setIndex(Number.parseInt(value, 10))
    }
    else if (value) {
      setTimeout(() => {
        indexes.value = indexes.value.filter(index => index !== Number.parseInt(value, 10))
      }, 100)
    }
  })
}

const getLatestIndex = computed(() => {
  return indexes.value?.length ? indexes.value[indexes.value.length - 1] : -1
})

const selectedStudio = computed(() => {
  return block.studios?.[getLatestIndex.value]
})

onMounted(() => {
  if (!itemRefs.value.length) {
    return
  }

  observerItems = new IntersectionObserver(callbackItems, {
    rootMargin: '-50% 0% -50% 0%',
    threshold: 0,
  })

  itemRefs.value.forEach(item => observerItems.observe(item))
})

onUnmounted(() => {
  itemRefs.value?.forEach(item => observerItems?.unobserve(item))
})
</script>

<template>
  <div
    v-editable="block"
    class="relative"
    :class="[colourText[block.colour], colourBackground[block.background]]"
  >
    <div class="relative z-1 section wrapper grid gap-x-[var(--app-inner-gutter)] grid-cols-1 md:grid-cols-12">
      <div class="md:col-start-4 md:-col-end-1 flex flex-col gap-[var(--app-vertical-rhythm)]">
        <StoryblokRichText
          v-if="storyblokRichTextContent(block.text)"
          :content="block.text"
          class="richtext prose-light prose-headings:max-w-[60ch] prose-headings:text-balance prose-h1:text-fluid-md prose-p:opacity-50 prose-p:text-18 prose-p:md:text-24 prose-p:max-w-[35ch] prose-p:text-pretty"
        />

        <ul
          v-if="block.studios?.length"
          class="flex flex-col gap-1"
        >
          <li
            v-for="(studio, index) in block.studios"
            ref="itemRefs"
            :key="studio._uid"
            :data-index="index"
            class="text-40 overflow-hidden"
            tabindex="0"
          >
            <span
              class="flex items-start gap-10 transition-transform ease-outSine"
              :class="[
                { 'translate-x-0 duration-300': indexes.includes(index) },
                { '-translate-x-[48px] duration-1000': !indexes.includes(index) },
              ]"
            >
              <span class="select-none">&rarr;</span>
              {{ studio.name }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <div class="absolute inset-0">
      <div class="sticky inset-0 mx-auto w-full h-screen flex flex-col items-end justify-center px-[var(--app-outer-gutter)]">
        <div
          class="w-2/3 md:w-1/2 aspect-4/3 rounded-[20px] overflow-hidden transition-all duration-300"
          :class="indexes.length ? 'opacity-100' : 'opacity-0'"
        >
          <div
            v-if="selectedStudio && selectedStudio.media"
            :key="selectedStudio._uid"
          >
            <img
              :src="selectedStudio.media.filename"
              :alt="selectedStudio.name"
              class="block w-full aspect-4/3 object-cover"
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.richtext {
  & :deep(* + *) {
    margin-block-start: 1lh;
  }
}
</style>
