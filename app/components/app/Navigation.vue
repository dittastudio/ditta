<script lang="ts" setup>
import type { ElementLink } from '#storyblok-components'

interface Props {
  items?: ElementLink[]
}

const { items } = defineProps<Props>()
</script>

<template>
  <nav class="grow">
    <ul class="group flex justify-between lg:justify-end flex-wrap text-navigation max-lg:-ml-5 -my-5 -mr-5">
      <li
        v-for="item in items"
        :key="item._uid"
      >
        <StoryblokLink
          :item="item.link"
          class="block p-5 group-hover:not-hover:opacity-50 transition-opacity duration-200 ease-out"
        >
          {{ item.text }}
        </StoryblokLink>
      </li>
    </ul>
  </nav>
</template>
