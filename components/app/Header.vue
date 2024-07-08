<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'
</script>

<template>
  <div class="absolute top-0 left-0 z-0 wrapper py-[var(--app-outer-gutter)]">
    <NuxtLink
      to="/"
      class="block"
    >
      <IconDitta class="w-full max-w-[100px] h-auto text-pink" />

      <h1 class="sr-only">
        ditta
      </h1>
    </NuxtLink>
  </div>
</template>

<style lang="postcss" scoped>
.app-header {
  /* margin-block-end: calc(-1 * (var(--app-vertical-rhythm) / 2)); */
  /* pt-[var(--app-outer-gutter)] */
}
</style>
