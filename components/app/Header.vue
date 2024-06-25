<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'
</script>

<template>
  <div class="app-header wrapper pt-[var(--app-outer-gutter)]">
    <IconDitta class="w-full max-w-[100px] h-auto text-pink" />

    <h1 class="sr-only">
      ditta
    </h1>
  </div>
</template>

<style lang="postcss" scoped>
.app-header {
  margin-block-end: calc(-1 * (var(--app-vertical-rhythm) / 2));
}
</style>
