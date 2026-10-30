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
      class="absolute inset-x-0 bottom-0 z-10 p-5 md:p-10 gap-4 flex flex-col @md:flex-row items-start @md:items-end justify-end @md:justify-between"
    >
      <div
        v-if="headline"
        class="pointer-events-none absolute top-[-50%] inset-x-0 bottom-0 bg-radial-[150%_100%_at_bottom_left] from-[black] from-50% to-transparent to-100% opacity-60 -z-1"
      />

      <h4
        v-if="headline"
        class="text-white text-20 text-balance @md:max-w-[18.5em] @3xl:text-24"
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
