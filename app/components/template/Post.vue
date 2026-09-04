<script lang="ts" setup>
import { formatTimeAgo, useDateFormat } from '@vueuse/core'
import type { Post } from '#storyblok-components'
import type { ISbStoryData } from '@storyblok/js'

interface Props {
  story: ISbStoryData<Post>
}

const { story } = defineProps<Props>()

const publishedDate = useDateFormat(story.created_at, 'Do MMMM YYYY')
</script>

<template>
  <article
    itemscope
    itemtype="https://schema.org/BlogPosting"
  >
    <UiTheme theme="light">
      <div class="wrapper max-w-295 flex flex-col gap-20 pt-80">
        <h1
          itemprop="headline"
          class="text-mono-title trim-both"
        >
          <UiTextMorph
            :min-weight="600"
            :text="story.name"
          />
        </h1>

        <div class="flex flex-col text-mono-small opacity-70">
          <time
            itemprop="datePublished"
            :datetime="story.created_at"
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
    >
      <BlockPostText
        v-if="block.component === 'block_post_text'"
        :block="block"
      />
    </UiTheme>
  </article>
</template>
