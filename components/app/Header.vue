<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'
</script>

<template>
  <div class="absolute top-0 left-0 z-10 wrapper py-[var(--app-outer-gutter)]">
    <NuxtLink
      to="/"
      class="inline-block text-[#111] hover:text-white"
    >
      <IconDitta class="w-full max-w-[100px] h-auto transition-colors duration-300" />

      <h1 class="sr-only">
        ditta
      </h1>
    </NuxtLink>
  </div>
</template>
