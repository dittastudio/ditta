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
    class="@container relative w-full h-full bg-green p-20 text-offblack"
  >
    <h3 class="text-24 font-medium mb-4">
      Shopify experts
    </h3>

    <p class="text-green-darker text-12 font-bold">
      Sell your products the right way
    </p>

    <div class="translate-y-1/4 @2xs:translate-y-0 absolute bottom-0 left-0 z-0 w-full h-[318px] overflow-hidden">
      <div class="graph flex flex-row w-[1400px] h-[318px]">
        <IconGraph class="fill-none w-[700px] h-[318px]" />

        <IconGraph class="fill-none w-[700px] h-[318px]" />
      </div>
    </div>
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
    filter: drop-shadow(10px 10px 8px rgba(14, 195, 44, 0.5));
  }
}
</style>
