<script lang="ts" setup>
import { formatTimeAgo, useDateFormat } from '@vueuse/core'
import type { Post } from '#storyblok-components'
import type { ISbStoryData } from '@storyblok/js'

interface Props {
  story: ISbStoryData<Post>
}

const { story } = defineProps<Props>()

const publishedDate = useDateFormat(story.published_at || story.created_at, 'Do MMMM YYYY')

const tags = await useDatasource('tags', story.content.tags)
</script>

<template>
  <article
    itemscope
    itemtype="https://schema.org/BlogPosting"
  >
    <UiTheme theme="light">
      <div class="wrapper max-w-295 flex flex-col gap-20 pt-50 md:pt-60 pb-20">
        <h1
          itemprop="headline"
          class="text-mono-title trim-both"
        >
          <UiTextMorph
            :disable-kerning="true"
            :min-weight="500"
            :text="story.name"
          />
        </h1>

        <div class="flex flex-col text-mono-small opacity-60">
          <time
            itemprop="datePublished"
            :datetime="story.published_at || story.created_at"
          >
            {{ publishedDate }}
          </time>

          <ClientOnly>
            <time
              itemprop="dateModified"
              :datetime="story.updated_at"
            >
              Updated {{ formatTimeAgo(new Date(story.updated_at ?? story.created_at)) }}
            </time>
          </ClientOnly>
        </div>
      </div>
    </UiTheme>

    <UiTheme
      v-for="block in story.content.blocks"
      :key="block._uid"
      theme="light"
      :class="`section--${block.component}`"
    >
      <BlockPostText
        v-if="block.component === 'block_post_text'"
        :block="block"
      />
    </UiTheme>

    <UiTheme
      v-if="story.content.tags"
      theme="light"
    >
      <ul class="wrapper max-w-295 flex flex-wrap gap-2 pt-20 pb-(--app-vertical-rhythm)">
        <li
          v-for="tag in tags"
          :key="tag.id"
        >
          <UiChip
            :text="tag.name"
            class="capitalize"
            size="medium"
            theme="white"
          />
        </li>
      </ul>
    </UiTheme>
  </article>
</template>
