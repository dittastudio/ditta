<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'
</script>

<template>
  <NuxtLink
    to="/"
    class="inline-block text-pink"
  >
    <IconDitta class="w-full max-w-[100px] h-auto transition-colors duration-300" />

    <h1 class="sr-only">
      ditta
    </h1>
  </NuxtLink>
</template>
