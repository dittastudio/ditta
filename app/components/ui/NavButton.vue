<script lang="ts" setup>
import { defineSound } from '@web-kits/audio'
import { hover } from '@@/.web-kits/core'

interface Props {
  // `primary` has a faint square at rest (Next). `secondary` is grey, its square only on hover. `danger` is coral on a
  // faint coral square (the clear confirm's Clear). `accent` is a setting that's on. `plain` takes the bar's own text
  // colour and tints on hover by --nav-button-tint, which the bar sets for its theme (see the Dock).
  variant?: 'primary' | 'secondary' | 'danger' | 'accent' | 'plain'
  // A square for an icon alone, rather than as wide as its text
  square?: boolean
  // `default` is the brief nav's; `compact` the Dock's, its slimmer bar less its p-1
  size?: 'default' | 'compact'
  // Set, it's a switch, on or off
  pressed?: boolean
}

// pressed defaults to undefined rather than false, so a button that isn't a switch doesn't say it's an off one
const { variant = 'secondary', square = false, size = 'default', pressed = undefined } = defineProps<Props>()

const variants = {
  primary: 'bg-white/15 text-white only-hover:hover:bg-white/25',
  secondary: 'text-grey/70 only-hover:hover:bg-white/15 only-hover:hover:text-white',
  danger: 'bg-coral/15 text-coral only-hover:hover:bg-coral/25',
  accent: 'bg-accent/15 text-accent only-hover:hover:bg-accent/25',
  plain: 'only-hover:hover:bg-current/(--nav-button-tint)',
}

const sizes = {
  default: { height: 'h-(--brief-nav-button)', square: 'w-(--brief-nav-button)' },
  compact: { height: 'h-9', square: 'w-12' },
}

const soundHover = defineSound(hover)
const { playHover } = useAudio()
</script>

<!-- The buttons on the site's bars, the Dock and the brief nav: a squircle that tints on hover and gives a little when
     pressed. aria-disabled dims it and stops the pointer, but leaves it focusable, so focus isn't lost while it waits;
     whatever it runs checks for itself. A named group, so what's inside can react to hovering it (group-hover/button). -->
<template>
  <button
    type="button"
    class="group/button flex shrink-0 items-center justify-center rounded-16 corner-shape-squircle text-14 font-medium whitespace-nowrap transition-[background-color,color,scale] duration-hover ease-outCubic active:scale-96 aria-disabled:pointer-events-none aria-disabled:opacity-40 md:text-16"
    :class="[variants[variant], sizes[size].height, square ? sizes[size].square : 'px-4']"
    :role="pressed === undefined ? undefined : 'switch'"
    :aria-checked="pressed"
    @pointerenter="playHover($event, soundHover)"
  >
    <slot />
  </button>
</template>
