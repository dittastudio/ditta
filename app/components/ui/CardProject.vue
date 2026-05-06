<script lang="ts" setup>
interface Props {
  title?: string
}

const { title } = defineProps<Props>()
</script>

<template>
  <div class="relative">
    <slot />

    <div class="absolute inset-0 p-5 md:p-10 flex items-end justify-start">
      <UiButton
        v-if="title"
        theme="light"
        :text="title"
      />
    </div>
  </div>
</template>
