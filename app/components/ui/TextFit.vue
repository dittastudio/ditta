<script setup lang="ts">
interface Props {
  text: string
  tracking?: string
}

const { text, tracking = '0em' } = defineProps<Props>()
</script>

<template>
  <span class="text-fit">
    <span>
      <span class="text-fit">
        <span>
          <span>{{ text }}</span>
        </span>

        <span aria-hidden="true">{{ text }}</span>
      </span>
    </span>

    <span aria-hidden="true">{{ text }}</span>
  </span>
</template>

<style scoped>
/* Inspired by: https://kizu.dev/fit-to-width/ */
/* TODO: add fallback for older browsers */

.text-fit {
  display: flex;
  container-type: inline-size;
  overflow: hidden;

  --captured-length: initial;
  --support-sentinel: var(--captured-length, 9999px);
  --text-fit-tracking: v-bind(tracking);

  & > [aria-hidden] {
    visibility: hidden;
    letter-spacing: var(--text-fit-tracking);
    margin-inline-end: calc(-1 * var(--text-fit-tracking));
  }

  & > :not([aria-hidden]) {
    flex-grow: 1;
    container-type: inline-size;

    --captured-length: 100cqi;
    --available-space: var(--captured-length);

    & > * {
      --support-sentinel: inherit;
      --captured-length: 100cqi;
      --ratio: tan(atan2(var(--available-space), var(--available-space) - var(--captured-length)));
      --font-size: clamp(1em, 1em * var(--ratio), var(--max-font-size, infinity * 1px) - var(--support-sentinel));
      inline-size: var(--available-space);

      &:not(.text-fit) {
        display: block;
        font-size: var(--font-size);
        letter-spacing: var(--text-fit-tracking);
        margin-inline-end: calc(-1 * var(--text-fit-tracking));

        @container (inline-size > 0) {
          white-space: nowrap;
        }
      }

      &.text-fit {
        --captured-length2: var(--font-size);
        font-variation-settings: 'opsz' tan(atan2(var(--captured-length2), 1px));
      }
    }
  }
}

@property --captured-length {
  syntax: '<length>';
  initial-value: 0px;
  inherits: true;
}

@property --captured-length2 {
  syntax: '<length>';
  initial-value: 0px;
  inherits: true;
}
</style>
