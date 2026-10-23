<script lang="ts" setup>
interface Props {
  title?: string | null
  headline?: string | null
}

const { title, headline } = defineProps<Props>()
</script>

<template>
  <div class="@container relative overflow-hidden rounded-20 squircle-40 shadow-lg">
    <slot />

    <div
      v-if="title || headline"
      class="absolute inset-0 z-10 p-5 md:p-10 gap-4 flex flex-col @md:flex-row items-start @md:items-end justify-end @md:justify-between"
    >
      <h4
        v-if="headline"
        class="text-white text-20 text-balance @md:max-w-110"
      >
        {{ headline }}
      </h4>

      <UiButton
        v-if="title"
        theme="light"
        :text="title"
        size="medium"
        class="shrink-0"
      />
    </div>
  </div>
</template>
