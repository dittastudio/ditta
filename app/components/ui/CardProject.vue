<script lang="ts" setup>
interface Props {
  title?: string
}

const { title } = defineProps<Props>()
</script>

<template>
  <div
    class="card-project relative overflow-hidden rounded-20 squircle-40 shadow-lg after:absolute after:inset-0 after:bg-black after:opacity-(--overlay-opacity,0) after:pointer-events-none after:rounded-[inherit] after:[corner-shape:inherit]"
  >
    <slot />

    <div class="absolute inset-0 z-10 p-5 md:p-10 flex items-end justify-start">
      <UiButton
        v-if="title"
        theme="light"
        :text="title"
      />
    </div>
  </div>
</template>
