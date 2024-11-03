<script lang="ts" setup>
import type { BlockServicesStoryblok } from '@/types/storyblok'

interface Props {
  block: BlockServicesStoryblok
}

const { block } = defineProps<Props>()
const classes = computed(() => ([colourText[block.colour], colourBackground[block.background]]))
const icons = {
  development: 'bg-pink',
  ecommerce: 'bg-yellow',
  cms: 'bg-green',
}
</script>

<template>
  <div
    v-editable="block"
    class="block"
    :class="classes"
  >
    <div class="section wrapper md:grid md:grid-cols-12 md:gap-20">
      <div class="col-span-full flex flex-col gap-[calc(var(--app-vertical-rhythm)/2)]">
        <StoryblokRichText
          v-if="storyblokRichTextContent(block.text)"
          :content="block.text"
          class="
            max-w-none
            prose
            prose-ditta
            prose-headings:font-medium
            prose-headings:text-balance
            prose-h1:text-fluid-md
            prose-h2:text-fluid-sm
            prose-p:text-18
            prose-p:md:text-24
            prose-p:text-pretty
            prose-p:max-w-[35ch]
            prose-default"
        />

        <ul
          v-if="block.services?.length"
          class="grid grid-cols-1 lg:grid-cols-3 gap-20 xl:gap-32 2xl:gap-[var(--app-outer-gutter)]"
        >
          <li
            v-for="service in block.services"
            :key="service._uid"
            class="flex flex-col gap-[calc(var(--app-outer-gutter)/2)] bg-grey rounded-[20px] p-40 group hover:bg-offblack transition-colors duration-150 ease-smooth"
          >
            <ElementService :service="service.service" />

            <div class="flex flex-col gap-10">
              <h2
                v-if="service.title"
                class="text-18 font-bold transition-colors duration-150 ease-smooth group-hover:text-white"
              >
                {{ service.title }}
              </h2>

              <p
                v-if="service.description"
                class="text-18 text-pretty text-body max-w-[35ch]"
              >
                {{ service.description }}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
