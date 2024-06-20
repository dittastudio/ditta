<script lang="ts" setup>
import type { BentoTeamStoryblok } from '@/types/storyblok'
import IconSign from '@/assets/icons/sign.svg'

interface Props {
  block: BentoTeamStoryblok
}

const { block } = defineProps<Props>()
</script>

<template>
  <div
    v-editable="block"
    class="relative w-full h-full bg-gradient-to-t from-offblack/25 to-grey p-20"
  >
    <IconSign class="sign absolute -top-8 left-[calc(50%_-_35px)]" />

    <img
      class="us w-11/12 h-auto block absolute bottom-0 left-1/2 -translate-x-1/2"
      src="/images/us.png"
      alt="ditta"
    >
  </div>
</template>

<style lang="postcss" scoped>
@keyframes swing {
  0% { transform: rotate(5deg); }
  100% { transform: rotate(-5deg); }
}

.sign {
  animation: swing ease-in-out 1s infinite alternate;
  transform-origin: center top;
  filter: drop-shadow(4px 4px 2px rgba(0, 0, 0, 0.1));
}

.us {
  filter: drop-shadow(15px 15px 1px rgba(0, 0, 0, 0.1));
}
</style>
