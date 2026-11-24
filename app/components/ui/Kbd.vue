<script lang="ts" setup>
// A flat, MacBook-style keycap for a shortcut hint. Purely visual: the shortcut itself is announced through
// aria-keyshortcuts on whatever it triggers. It presses down while an ancestor is marked data-pressed (a held key, see
// useBriefKeys) or its option's label is held down with the mouse (only a label: body is :active on any click).
// A press shifts the key down, fades its lip and dims the whole key; the edge stays put. The lip is its own layer, so
// it fades rather than animating a shadow mixed from currentcolor (which flickers). Layers share the legend's grid cell instead of being
// positioned, since callers may position the key absolutely.
// `shape="return"` draws the tall ISO return key, notched at the bottom left, as an SVG: no box can take that shape.

interface Props {
  shape?: 'square' | 'return'
}

const { shape = 'square' } = defineProps<Props>()

// The return key's outline: a wide top, notched below on the left. Outer corners round by 4 (as the square key's
// rounded-4), the inner one by 2.
const returnPath =
  'M4 0H24A4 4 0 0 1 28 4V24A4 4 0 0 1 24 28H10A4 4 0 0 1 6 24V16A2 2 0 0 0 4 14A4 4 0 0 1 0 10V4A4 4 0 0 1 4 0Z'

// The lip is the outline less itself nudged up, so it's a band along every bottom edge, the notch's included
const lipMask = useId()

const press =
  'transition-[translate,opacity] duration-100 ease-outCubic in-[label:active]:opacity-60 in-data-pressed:opacity-60 motion-safe:in-[label:active]:translate-y-px motion-safe:in-data-pressed:translate-y-px motion-reduce:transition-none'
const lipFade =
  'transition-opacity duration-100 ease-outCubic in-[label:active]:opacity-0 in-data-pressed:opacity-0 motion-reduce:transition-none'
</script>

<template>
  <kbd
    v-if="shape === 'return'"
    class="inline-grid size-7 font-mono text-14 font-medium leading-none"
    :class="press"
    aria-hidden="true"
  >
    <svg
      class="col-start-1 row-start-1 size-full overflow-visible"
      viewBox="0 0 28 28"
    >
      <mask :id="lipMask">
        <path
          :d="returnPath"
          fill="white"
        />
        <path
          :d="returnPath"
          fill="black"
          transform="translate(0 -1.5)"
        />
      </mask>
      <path
        :d="returnPath"
        class="fill-current/8 stroke-current/15"
        stroke-width="1"
        vector-effect="non-scaling-stroke"
      />
      <path
        :d="returnPath"
        class="fill-current/30"
        :class="lipFade"
        :mask="`url(#${lipMask})`"
      />
    </svg>
    <span class="col-start-1 row-start-1 mr-1.5 self-start justify-self-end"><slot /></span>
  </kbd>

  <kbd
    v-else
    class="inline-grid size-5 place-items-center rounded-4 bg-current/8 font-mono text-10 font-medium leading-none inset-ring inset-ring-current/15 after:col-start-1 after:row-start-1 after:place-self-stretch after:rounded-4 after:shadow-key after:transition-opacity after:duration-100 after:ease-outCubic in-[label:active]:after:opacity-0 in-data-pressed:after:opacity-0 motion-reduce:after:transition-none"
    :class="press"
    aria-hidden="true"
    ><span class="col-start-1 row-start-1"><slot /></span
  ></kbd>
</template>
