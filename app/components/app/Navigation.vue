<script lang="ts" setup>
import type { ElementLink } from '#storyblok-components'

interface Props {
  items?: ElementLink[]
}

const { items } = defineProps<Props>()
</script>

<template>
  <nav class="w-full">
    <ul>
      <li
        v-for="item in items"
        :key="item._uid"
      >
        <StoryblokLink :item="item.link">
          {{ item.text }}
        </StoryblokLink>
      </li>
    </ul>
  </nav>
</template>
