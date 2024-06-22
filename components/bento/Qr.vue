<script lang="ts" setup>
import type { BentoQrStoryblok } from '@/types/storyblok'
import IconDittaQr from '@/assets/icons/ditta-qr.svg'

interface Props {
  block: BentoQrStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="bg-blue flex flex-col justify-between h-full gap-10 py-10"
  >
    <ElementMarquee
      background-color="transparent"
      text-color="offblack"
      text-size="bento"
      :copy="['Follow us']"
      duration="60s"
      direction="right"
    />

    <div class="px-20">
      <IconDittaQr class="w-full h-auto" />
    </div>

    <ElementMarquee
      background-color="transparent"
      text-color="offblack"
      text-size="bento"
      :copy="['Worship us']"
      duration="60s"
      direction="left"
    />
  </div>
</template>
