<script lang="ts" setup>
import type { BlockHero } from '#storyblok-components'
import IconLogo from '@/assets/icons/ditta.svg'

interface Props {
  block: BlockHero
}

defineProps<Props>()
</script>

<template>
  <div class="wrapper min-h-svh flex flex-col justify-end">
    <IconLogo class="w-full h-auto -mb-1.5" />
  </div>
</template>
