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
const mediaPosition = ref({ x: 0, y: 0 })
const mediaVisible = computed(() => indexes.value.length)

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

const setMediaPosition = (event: MouseEvent) => {
  const x = event.pageX - window.scrollX
  const y = event.pageY - window.scrollY

  mediaPosition.value = { x: x + 50, y: y + 50 }
}

const mediaStyles = computed(() => {
  const position = `translate3d(${mediaPosition.value.x}px, ${mediaPosition.value.y}px, 0)`
  const scale = `${selectedStudio.value && mediaVisible.value ? 'scale(1)' : 'scale(0.9)'}`
  const transformStyles = `${position} ${scale}`

  return {
    transform: transformStyles,
    opacity: selectedStudio.value && mediaVisible.value ? 1 : 0,
  }
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

  window.addEventListener('mousemove', setMediaPosition)
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

    <div
      class="fixed top-0 left-0 z-0 w-1/3 aspect-4/3 rounded-[20px] bg-white transition-all duration-1000 ease-outExpo overflow-hidden"
      :style="mediaStyles"
    >
      <!-- <Transition
        mode="out-in"
        name="fade"
      > -->
      <div
        v-if="selectedStudio && selectedStudio.media"
        :key="selectedStudio._uid"
      >
        <img
          :src="selectedStudio.media.filename"
          :alt="selectedStudio.name"
          class="block w-full h-full object-cover"
        >
      </div>
      <!-- </Transition> -->
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.richtext {
  & :deep(* + *) {
    margin-block-start: 1lh;
  }
}

.fade {
  /* &-enter-active, &-leave-active {
    transition: opacity 0.3s;
  }

  &-enter-from, &-leave-to {
    opacity: 0;
  } */
}
</style>
