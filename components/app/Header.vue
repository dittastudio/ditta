<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'

const { hex } = useAccentColour()
</script>

<template>
  <div class="absolute top-0 left-0 z-0 wrapper py-[var(--app-outer-gutter)]">
    <NuxtLink
      to="/"
      class="block"
    >
      <IconDitta
        class="w-full max-w-[100px] h-auto"
        :style="{ color: hex }"
      />

      <h1 class="sr-only">
        ditta
      </h1>
    </NuxtLink>
  </div>
</template>
