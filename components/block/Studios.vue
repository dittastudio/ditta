<script lang="ts" setup>
import type { BlockStudiosStoryblok } from '@/types/storyblok'
import { storyblokRichTextContent } from '@/utilities/storyblok'
import { colourBackground, colourText } from '@/utilities/maps'

interface Props {
  block: BlockStudiosStoryblok
}

const { block } = defineProps<Props>()
const itemRefs = ref<HTMLElement[]>([])
const indexes = ref<number[]>([])

const setIndex = (index: number) => {
  if (indexes.value.includes(index)) {
    return
  }

  indexes.value.push(index)
}

const callback: IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => {
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

let observer: IntersectionObserver

onMounted(() => {
  if (!itemRefs.value.length) {
    return
  }

  observer = new IntersectionObserver(callback, {
    rootMargin: '-50% 0% -50% 0%',
    threshold: 0,
  })

  itemRefs.value.forEach(item => observer.observe(item))
})

onUnmounted(() => {
  itemRefs.value?.forEach(item => observer?.unobserve(item))
})
</script>

<template>
  <div
    v-editable="block"
    class="block-studios"
    :class="[colourText[block.colour], colourBackground[block.background]]"
  >
    <div class="section wrapper grid gap-x-[var(--app-inner-gutter)] grid-cols-1 md:grid-cols-12">
      <div class="md:col-start-4 md:-col-end-1 flex flex-col gap-40">
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
            <!--
            @mouseover="setIndex(index)"
            @focus="setIndex(index)"
            -->

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
  </div>
</template>

<style lang="postcss" scoped>
.block-studios {
  .richtext {
    & :deep(* + *) {
      margin-block-start: 1lh;
    }
  }
}
</style>
