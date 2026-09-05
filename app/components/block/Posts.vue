<script lang="ts" setup>
import type { BlockPosts, Post } from '#storyblok-components'
import { formatTimeAgo, useDateFormat } from '@vueuse/core'

interface Props {
  block: BlockPosts
}

const { block } = defineProps<Props>()

const posts = await useStories<Post>('/blog', {
  content_type: 'post',
  sort_by: 'first_published_at:desc',
  per_page: 100,
})

const placeholderCount = 6
const placeholders = Array.from({ length: placeholderCount }, (_, index) => index)
</script>

<template>
  <div
    v-editable="block"
    class="wrapper max-w-295 min-h-svh"
    :class="{
      'pt-50 md:pt-60': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <ul
      v-if="posts.length"
      class="text-mono-body flex flex-col gap-20"
    >
      <li
        v-for="post in posts"
        :key="post.uuid"
        class="flex flex-wrap gap-4 items-baseline justify-between"
      >
        <NuxtLink :to="`/${post.full_slug}`">
          <h2>{{ post.name }}</h2>

          <p class="opacity-60">{{ post.content.summary }}</p>
        </NuxtLink>

        <div class="flex flex-col text-mono-small text-11 opacity-60">
          <time
            itemprop="datePublished"
            :datetime="post.created_at"
          >
            {{ useDateFormat(post.created_at, 'Do MMMM YYYY') }}
          </time>

          <ClientOnly>
            <time
              itemprop="dateModified"
              :datetime="post.updated_at"
            >
              Updated {{ formatTimeAgo(new Date(post.updated_at ?? post.created_at)) }}
            </time>
          </ClientOnly>
        </div>
      </li>

      <li
        v-for="placeholder in placeholders"
        :key="`placeholder-${placeholder}`"
        class="flex flex-wrap gap-4 items-baseline justify-between opacity-40"
      >
        <div>
          <h2>Coming soon</h2>

          <p class="opacity-60">New writing is on its way.</p>
        </div>

        <div class="flex flex-col text-mono-small text-11 opacity-60">
          <span>Coming soon</span>
        </div>
      </li>
    </ul>
  </div>
</template>
