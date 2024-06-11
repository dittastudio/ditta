<script setup lang="ts">
export interface Props {
  copy: any
}

const { copy } = defineProps<Props>()
</script>

<template>
  <div
    v-if="copy"
    class="block-text section wrapper grid gap-x-[length:var(--app-inner-gutter)] md:grid-cols-2"
  >
    <div class="col-span-full w-full">
      <div v-html="copy" />
    </div>
  </div>
</template>

<style lang="postcss">
.block-text {
  --text-size: utopia.clamp(40, 64);
  --line-height: theme('lineHeight.snug');

  & p {
    max-width: 60ch;

    font-size:  var(--text-size);
    line-height: var(--line-height);
    text-wrap: balance;
    letter-spacing: theme('letterSpacing.tight');
  }

  & p + p {
    margin-block-start: 0.5lh;
  }
}
</style>
