<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { BlockTeam } from '#storyblok-components'

interface Props {
  block: BlockTeam
}

const { block } = defineProps<Props>()
const humans = computed(() => block.humans?.filter((human) => typeof human !== 'string') || [])
const button = computed(() => block.cta?.[0])
</script>

<template>
  <div
    class="@container wrapper"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div class="grid grid-cols-1 gap-x-(--app-gutter-inner) gap-y-10 md:gap-y-20 @4xl:grid-cols-12">
      <h2
        v-if="block.heading"
        class="col-span-full text-display whitespace-pre-wrap trim-both"
      >
        {{ block.heading }}
      </h2>

      <div class="@4xl:col-span-6 flex flex-col gap-10 md:gap-20">
        <UiLockup
          v-if="storyblokRichTextContent(block.copy)"
          :copy="block.copy"
        />

        <StoryblokLink
          v-if="button?.link"
          :item="button.link"
        >
          <UiButton
            :text="button.text"
            :theme="button.theme as Themes"
          />
        </StoryblokLink>
      </div>

      <div class="@container/team @4xl:col-span-5 @4xl:col-end-13">
        <ul class="flex flex-col gap-[calc(var(--app-gutter-inner)*4)] @2xl/team:flex-row">
          <li v-for="human in humans">
            <UiPerson
              :image="human.content.image"
              :name="human.content.name"
              :position="human.content.position"
            />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
