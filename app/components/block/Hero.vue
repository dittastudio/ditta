<script lang="ts" setup>
import type { BlockHero } from '#storyblok-components'
import IconLogo from '@/assets/icons/ditta.svg'

interface Props {
  block: BlockHero
}

defineProps<Props>()
</script>

<template>
  <div class="wrapper min-h-screen flex flex-col justify-end">
    <UiMuxVideo
      class="w-full h-full"
      playback-id="imOig2IdLWSslroz012f629Gm00hVsAAq702Lg2sDmyG00k"
      :is-cover="true"
      playsinline
      autoplay
      muted
      loop
    />
    <IconLogo class="w-full h-auto -mb-1.5" />
  </div>
</template>
