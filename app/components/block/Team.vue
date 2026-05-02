<script lang="ts" setup>
import type { BlockTeam } from '#storyblok-components'

interface Props {
  block: BlockTeam
}

const { block } = defineProps<Props>()
const humans = computed(() => block.humans?.filter((human) => typeof human !== 'string') || [])
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

      <UiLockup
        class="@4xl:col-span-6"
        :copy="block.copy"
      />

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
