<script lang="ts" setup>
// A flat, MacBook-style keycap for a shortcut hint. Purely visual: the shortcut itself is announced through
// aria-keyshortcuts on whatever it triggers. It presses down while an ancestor is marked data-pressed (a held key, see
// useBriefKeys) or the label or button it's in is held down with the mouse (only those: body is :active on any click).
// An option's key stays down while the option is picked, like a key latched on.
// A press shifts the key down, fades its lip and dims the whole key; the edge stays put.
// Hidden unless an ancestor has data-shortcuts: "on" shows it, "preview" shows it faintly (the brief's keyboard
// setting, see BriefSettingShortcuts). display: none, so a hidden key takes no room; it animates both ways through
// @starting-style. Showing lives on the outer <kbd> and pressing on the inner key, so the two never fight over opacity.
// Never on touch, where there's no keyboard to use it with.
// `tone="fixed"` is for keys inside buttons (the nav's): its own colours rather than the text's, so keys on buttons of
// different colours (Next, Back) read as the same size, and a larger glyph to suit.

interface Props {
  tone?: 'current' | 'fixed'
}

const { tone = 'current' } = defineProps<Props>()

const tones = {
  current: 'bg-current/8 text-10 inset-ring-current/15',
  fixed: 'bg-white/10 text-14 text-white inset-ring-white/20',
}

const press =
  'transition-[translate,opacity] duration-100 ease-outCubic key-down:opacity-60 motion-safe:key-down:translate-y-px motion-reduce:transition-none'
// Comes in like the nav's Start again button (brief-pop): from just under full size and out of focus. Leaves quicker
// and smaller. The hidden state is where it leaves to, @starting-style where it enters from. Reduced motion keeps
// the fade only.
const visibility =
  'hidden opacity-0 scale-95 blur-2xs transition-[display,opacity,scale,filter] transition-discrete duration-200 ease-outCubic in-data-shortcuts:inline-flex in-data-shortcuts:scale-100 in-data-shortcuts:blur-none in-data-shortcuts:duration-300 in-data-shortcuts:ease-outQuart in-data-[shortcuts=on]:opacity-100 in-data-[shortcuts=preview]:opacity-50 starting:in-data-shortcuts:opacity-0 starting:in-data-shortcuts:scale-90 starting:in-data-shortcuts:blur-xs only-touch:hidden! motion-reduce:scale-100 motion-reduce:blur-none motion-reduce:starting:in-data-shortcuts:scale-100 motion-reduce:starting:in-data-shortcuts:blur-none'
</script>

<template>
  <kbd
    :class="visibility"
    aria-hidden="true"
  >
    <span
      class="grid size-5 place-items-center rounded-4 font-mono font-medium leading-none inset-ring after:col-start-1 after:row-start-1 after:place-self-stretch after:rounded-4 after:shadow-key after:transition-opacity after:duration-100 after:ease-outCubic key-down:after:opacity-0 motion-reduce:after:transition-none"
      :class="[press, tones[tone]]"
      ><span class="col-start-1 row-start-1"><slot /></span
    ></span>
  </kbd>
</template>
