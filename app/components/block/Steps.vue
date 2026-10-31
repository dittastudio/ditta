<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { Block } from '#storyblok-schema'
import { useEventListener } from '@vueuse/core'
import { defineSound } from '@web-kits/audio'
import { boop, levelUp } from '@@/.web-kits/core'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import IconMarioBrick from '@/assets/icons/mario-brick.svg'
import IconMarioSequence from '@/assets/icons/mario-sequence.svg'
import IconPixelArrow from '@/assets/icons/pixel-arrow.svg'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  block: Block<'block_steps'>
}

const { block } = defineProps<Props>()
const cardsRefs = useTemplateRef('card')

let cardsAnimation: gsap.Context | undefined

onMounted(() => {
  cardsAnimation = gsap.context(() => {
    cardsRefs.value?.forEach((el, index) => {
      const sign = index % 2 === 0 ? 1 : -1
      const rotateFrom = sign * gsap.utils.random(3, 9)

      gsap.fromTo(
        el,
        { scale: 1.2, rotate: rotateFrom },
        {
          scrollTrigger: {
            trigger: el.parentElement?.parentElement,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
          },
          ease: 'power1.in',
          scale: 1,
          rotate: -rotateFrom,
        },
      )
    })
  })
})

onUnmounted(() => cardsAnimation?.revert())

const arrowEl = useTemplateRef('arrow')
const arrowLiftEl = useTemplateRef('arrowLift') // inside the button, so the lift doesn't fight the shake's translate
const lockup = useTemplateRef('lockup')

const {
  phase: marioPhase,
  bricks,
  start: startMario,
  tap: onMarioTap,
} = useMario({
  section: useTemplateRef('marioSection'),
  stage: useTemplateRef('marioStage'),
  sprite: useTemplateRef('mario'),
  sheet: useTemplateRef('marioSheet'),
  lockup: () => lockup.value?.$el as HTMLElement | undefined,
  pipe: arrowLiftEl,
})

const isArrowLocked = computed(() => marioPhase.value !== 'hidden') // upright and red from rage on, through its fade
const isArrowGone = computed(() => marioPhase.value === 'falling' || marioPhase.value === 'playing') // Mario's out of the tail

const { play } = useAudio()
const soundBoop = defineSound(boop)
const soundLevelUp = defineSound(levelUp)

// Written straight to a CSS variable, so following the mouse never re-renders the block
const stopTilt = useEventListener(
  window,
  'mousemove',
  (event: MouseEvent) =>
    arrowEl.value?.style.setProperty('--tilt', `${(event.clientX / window.innerWidth) * 80 - 40}deg`),
  { passive: true },
)

const { shakeClass: arrowShakeClass, click: rageArrow } = useRageClicks({
  onClick: () => play(soundBoop),
  onRage: () => {
    stopTilt() // upright from here on
    arrowEl.value?.blur() // it's done; otherwise Mario's arrow keys light up its focus ring
    play(soundLevelUp)
    startMario()
  },
})

const onArrowClick = () => {
  if (marioPhase.value === 'hidden') rageArrow()
}

// tabindex="-1" still lets a click focus it, so stray clicks after rage would bring the ring back
const onArrowMouseDown = (event: MouseEvent) => {
  if (marioPhase.value !== 'hidden') event.preventDefault()
}
</script>

<template>
  <div
    v-editable="block"
    class="flex flex-col gap-(--app-gutter-outer) overflow-clip"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div
      ref="marioSection"
      class="flex flex-col gap-(--app-gutter-outer)"
    >
      <div class="wrapper grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-5">
        <UiLockup
          ref="lockup"
          class="col-span-full md:col-span-8"
          :heading="block.heading"
          :copy="block.copy"
        />

        <div class="col-span-full md:col-span-4">
          <button
            ref="arrow"
            type="button"
            class="relative z-1 block w-30 md:w-40 mx-auto transition-opacity duration-300 ease-outCubic"
            :class="[
              marioPhase === 'raging' ? 'shake-3' : arrowShakeClass,
              { 'cursor-default': marioPhase !== 'hidden', 'opacity-0 pointer-events-none': isArrowGone },
            ]"
            aria-label="Poke the arrow"
            :tabindex="marioPhase === 'hidden' ? undefined : -1"
            :aria-disabled="marioPhase !== 'hidden' || undefined"
            @mousedown="onArrowMouseDown"
            @click="onArrowClick"
          >
            <!-- On mobile it lifts clear on rage, so Mario has room to come out of the tail -->
            <div
              ref="arrowLift"
              :class="{
                'transition-scale duration-150 ease-out hover:scale-102 active:scale-98': marioPhase === 'hidden',
                'max-md:-translate-y-20 transition-transform duration-300 ease-outCubic': isArrowLocked,
              }"
            >
              <!-- Tail doubles as a pipe: upright and red while raging, until Mario is out -->
              <IconPixelArrow
                class="w-full data-rage:[&_[fill='#24F456']]:fill-rage-light data-rage:[&_[fill='#00E640']]:fill-rage data-rage:[&_[fill='#00C340']]:fill-rage-dark"
                :class="{ 'animate-bob rotate-(--tilt)': !isArrowLocked }"
                :data-rage="isArrowLocked || undefined"
              />
            </div>
          </button>
        </div>
      </div>

      <div
        ref="marioStage"
        class="relative -mt-[calc(var(--app-gutter-outer)*1.5)] md:mt-[calc(var(--app-gutter-outer)*0.5)] lg:mt-0"
        aria-hidden="true"
      >
        <div
          ref="mario"
          class="absolute bottom-full left-0 size-10 md:size-12 overflow-hidden touch-manipulation select-none"
          :class="{ invisible: marioPhase === 'hidden' || marioPhase === 'raging' }"
          @pointerdown="onMarioTap"
        >
          <div
            ref="marioSheet"
            class="h-full w-max"
          >
            <IconMarioSequence
              class="h-full w-auto"
              shape-rendering="crispEdges"
            />
          </div>
        </div>

        <!-- Sized up front: bricks only render once the stage is measured -->
        <div class="flex justify-center h-10 md:h-12 overflow-x-clip">
          <IconMarioBrick
            v-for="(brick, index) in bricks"
            :key="index"
            class="size-10 md:size-12 shrink-0 motion-reduce:[--brick-rise:0]"
            :class="brick ? ['animate-brick-in', { '[--brick-rise:0]': brick.isUnder }] : 'opacity-0'"
            :style="{ animationDelay: brick?.delay }"
          />
        </div>
      </div>
    </div>

    <div class="wrapper flex flex-col gap-(--app-gutter-outer)">
      <div
        v-for="(step, index) in block.steps"
        v-editable="step"
        :key="step._uid"
        class="sticky top-0 h-svh flex flex-col items-center justify-center max-md:px-(--app-gutter-outer)"
      >
        <div
          class="w-full flex flex-col gap-[calc(var(--app-gutter-outer)*2)] md:gap-(--app-gutter-outer)"
          :class="{
            'items-center': true,
            'md:items-start': index === 0,
            'md:items-center': index === 1 || index > 2,
            'md:items-end': index === 2,
          }"
        >
          <div
            ref="card"
            class="max-w-120"
            :style="{
              paddingTop: `calc(var(--app-gutter-outer) * ${index})`,
            }"
          >
            <CardStep
              :number="`0${index + 1}`.slice(-2)"
              :title="step.title"
              :heading="step.heading"
              :copy="step.copy"
              :theme="'theme' in step ? (step.theme as Themes) : undefined"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
