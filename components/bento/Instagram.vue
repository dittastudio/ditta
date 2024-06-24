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
    class="bg-grey relative h-full"
  >
    <StoryblokLink
      :item="block.link"
      class="h-full"
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

      <IconInstagram class="top-20 right-20 absolute z-10 w-20 h-20 text-white" />

      <div class="bg-gradient-to-t from-black/50 to-black/0 absolute bottom-0 left-0 z-10 flex items-center justify-start w-full gap-10 p-20">
        <div class="bg-pink w-40 h-40 p-8 rounded-full">
          <IconDitta class="size-full text-offblack block" />
        </div>

        <div class="flex flex-col gap-[2px]">
          <h2 class="text-12 font-bold text-white">
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
