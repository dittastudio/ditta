<script lang="ts" setup>
import type { BlockPosts, Post } from '#storyblok-components'

interface Props {
  block: BlockPosts
}

const { block } = defineProps<Props>()

const posts = await useStories<Post>('/blog', {
  content_type: 'post',
  sort_by: 'first_published_at:desc',
  per_page: 100,
})
</script>

<template>
  <div
    v-editable="block"
    class="wrapper flex flex-col justify-center"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <ul v-if="posts.length">
      <li
        v-for="post in posts"
        :key="post.uuid"
      >
        <NuxtLink :to="`/${post.full_slug}`">
          <h2>
            {{ post.name }}
          </h2>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
