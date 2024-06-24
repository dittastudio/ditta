<script lang="ts" setup>
import type { BentoInstagramStoryblok } from '@/types/storyblok'
import IconDitta from '@/assets/icons/ditta.svg'
import IconInstagram from '@/assets/icons/instagram.svg'

interface Props {
  block: BentoInstagramStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="relative w-full h-full bg-grey"
  >
    <StoryblokLink
      :item="block.link"
      class="block w-full h-full"
    >
      <MediaImage
        v-if="block.image"
        class="absolute z-0 pointer-events-none [&>img]:object-cover [&>img]:!h-full"
        :asset="block.image"
        sizes="
        100vw
        sm:100vw
      "
      />

      <IconInstagram class="absolute top-20 right-20 z-10 w-20 h-20 text-white" />

      <div class="absolute left-0 bottom-0 z-10 w-full flex items-center justify-start gap-10 p-20 bg-gradient-to-t from-black/50 to-black/0">
        <div class="rounded-full bg-pink w-40 h-40 p-8">
          <IconDitta class="size-full text-offblack block" />
        </div>

        <div class="flex flex-col gap-[2px]">
          <h2 class="text-12 text-white font-bold">
            _dittastudio
          </h2>

          <p class="text-12 text-white">
            {{ block.caption }}
          </p>
        </div>
      </div>
    </StoryblokLink>
  </div>
</template>
