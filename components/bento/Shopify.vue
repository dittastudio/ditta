<script lang="ts" setup>
import type { BentoShopifyStoryblok } from '@/types/storyblok'
import IconGraph from '@/assets/icons/graph.svg'

interface Props {
  block: BentoShopifyStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="@container relative h-full bg-green-lighter text-offblack"
  >
    <StoryblokLink
      :item="block.link"
      class="block h-full p-20"
    >
      <div
        v-if="block.headline || block.tagline"
        class="relative z-10 flex flex-col items-start justify-start w-full h-full"
      >
        <h3
          v-if="block.headline"
          class="text-24 mb-4 font-medium"
        >
          {{ block.headline }}
        </h3>

        <p
          v-if="block.tagline"
          class="text-green-darker text-12 font-bold"
        >
          {{ block.tagline }}
        </p>

        <div class="mt-auto ml-auto">
          <ButtonAppearance
            text-color="offblack"
            background-color="green"
            class="shadow-green-darker/50 shadow-sm"
          >
            <span class="flex items-center justify-center gap-8">
              Discover more <span>&rarr;</span>
            </span>
          </ButtonAppearance>
        </div>
      </div>

      <div class="translate-y-1/4 @2xs:translate-y-0 absolute bottom-0 left-0 z-0 w-full h-[318px] overflow-hidden">
        <div class="graph flex flex-row w-[1400px] h-[318px]">
          <IconGraph class="fill-none w-[700px] h-[318px]" />

          <IconGraph class="fill-none w-[700px] h-[318px]" />
        </div>
      </div>
    </StoryblokLink>
  </div>
</template>

<style lang="postcss" scoped>
@keyframes graph {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-700px);
  }
}

.graph {
  animation: graph 30s linear infinite;

  svg {
    filter: drop-shadow(10px 10px 8px rgb(14 195 44 / 50%));
  }
}
</style>
