<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { Block } from '#storyblok-schema'
import { useEventListener } from '@vueuse/core'
import { defineSound } from '@web-kits/audio'
import { boop, levelUp } from '@@/.web-kits/core'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { SIZE } from '@/utils/mario/physics'

import IconMarioAlien from '@/assets/icons/mario-alien.svg'
import IconMarioBoxEmpty from '@/assets/icons/mario-box-empty.svg'
import IconMarioBox from '@/assets/icons/mario-box.svg'
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
const arrowLiftEl = useTemplateRef('arrowLift')
const lockup = useTemplateRef('lockup')
const gamepad = useTemplateRef('gamepad')
const marioSectionEl = useTemplateRef('marioSection')

const {
  phase: marioPhase,
  isPlayable: isMarioPlayable,
  bricks,
  box: marioBox,
  boxState: marioBoxState,
  flyingCoins,
  removeCoin,
  hasAlien,
  start: startMario,
  press: pressMario,
  release: releaseMario,
} = useMario({
  section: marioSectionEl,
  stage: useTemplateRef('marioStage'),
  sprite: useTemplateRef('mario'),
  sheet: useTemplateRef('marioSheet'),
  lockup: () => lockup.value?.$el as HTMLElement | undefined,
  box: useTemplateRef('marioBoxEl'),
  pipe: arrowLiftEl,
  alien: useTemplateRef('alien'),
  alienSheet: useTemplateRef('alienSheet'),
  gamepad: () => gamepad.value?.$el as HTMLElement | undefined,
})

// In its own size, a brick, so it holds at every breakpoint
const marioBoxTransform = computed(() =>
  marioBox.value
    ? `translate(${(marioBox.value.left / SIZE) * 100}%, ${(marioBox.value.top / SIZE) * 100}%)`
    : undefined,
)

const isArrowLocked = computed(() => marioPhase.value !== 'hidden') // upright and red from rage on, through its fade
// Mario's out of the tail, until the scene has cleared away after the alien gets him
const isArrowGone = computed(() => !['hidden', 'raging', 'piping'].includes(marioPhase.value))

const { play, isAudioOn } = useAudio()
const soundBoop = defineSound(boop)
const soundLevelUp = defineSound(levelUp)

const appStore = useAppStore()
const soundPowerUp = defineSample('/sounds/smb_powerup.opus')

// Ready by the time he's clickable: loads alongside his other sounds, once the arrow rages
watch([isAudioOn, marioPhase], ([on, phase]) => on && phase !== 'hidden' && soundPowerUp.load())

const onMarioClick = () => {
  appStore.cycleAccent()
  void soundPowerUp.play()
}

// Written straight to a CSS variable, so following the mouse never re-renders the block. Held still from rage on.
useEventListener(
  window,
  'mousemove',
  (event: MouseEvent) => {
    if (marioPhase.value !== 'hidden') return
    arrowEl.value?.style.setProperty('--tilt', `${(event.clientX / window.innerWidth) * 80 - 40}deg`)
  },
  { passive: true },
)

const {
  shakeClass: arrowShakeClass,
  click: rageArrow,
  resetRage,
} = useRageClicks({
  onClick: () => play(soundBoop),
  onRage: () => {
    arrowEl.value?.blur() // it's done; otherwise Mario's arrow keys light up its focus ring
    window.getSelection()?.removeAllRanges() // anything picked up on the way, now that the page can't be selected
    play(soundLevelUp)
    startMario()
  },
})

// Up into its lifted class from where it sat. A one-shot animation, not a transition: mobile WebKit re-ran a transition
// from the bottom when the rage shake stopped and the pipe changed layers, so the arrow dropped and rose again.
// No-op on desktop, where the class doesn't lift it.
const liftArrow = () => {
  const el = arrowLiftEl.value
  if (!el || getComputedStyle(el).translate === 'none') return

  const easing = getComputedStyle(document.documentElement).getPropertyValue('--ease-outCubic').trim() || 'ease-out'
  el.animate([{ translate: '0 0' }, {}], { duration: 300, easing })
}

watch(isArrowLocked, (locked) => locked && liftArrow(), { flush: 'post' })

// The padding grows above the section when Mario comes out and shrinks when he's gone: scroll by the same amount, so
// the arrow stays under the finger that raged it and nothing on screen jumps
watch(
  () => marioPhase.value === 'hidden',
  async () => {
    const before = marioSectionEl.value?.getBoundingClientRect().top
    await nextTick()
    const after = marioSectionEl.value?.getBoundingClientRect().top
    if (before !== undefined && after !== undefined && after !== before) {
      window.scrollBy({ top: after - before, behavior: 'instant' })
    }
  },
)

// From rage until the scene has cleared: the whole page goes unselectable, and its touch gestures quiet down
const isMarioOut = computed(() => marioPhase.value !== 'hidden')
const isTouch = useAtMedia('(hover: none)')

useHead({ htmlAttrs: { 'data-mario': computed(() => (isMarioOut.value ? '' : undefined)) } })

// Anything that still gets selected, by a long press iOS reads as text selection, say, is cleared straight away
useEventListener(document, 'selectionchange', () => {
  const selection = window.getSelection()
  if (isMarioOut.value && selection && !selection.isCollapsed) selection.removeAllRanges()
})

// Double-tap zoom anywhere else on the page: iOS ignores touch-action: manipulation unless it's on the very element
// tapped, so a second tap hard on the heels of the first is cancelled. A single tap still clicks.
const DOUBLE_TAP = 350 // ms
let lastTouchEnd = 0

useEventListener(
  document,
  'touchend',
  (event: TouchEvent) => {
    if (!isMarioOut.value) return
    if (event.timeStamp - lastTouchEnd < DOUBLE_TAP) event.preventDefault()
    lastTouchEnd = event.timeStamp
  },
  { passive: false },
)

// Long-press menus on links and images, on touch screens; a mouse's right-click menu is left alone
useEventListener(document, 'contextmenu', (event: Event) => {
  if (isMarioOut.value && isTouch.value) event.preventDefault()
})

// Back from the alien: the arrow can be raged at all over again
watch(marioPhase, (phase) => phase === 'hidden' && resetRage())

const onArrowClick = () => {
  if (marioPhase.value === 'hidden') rageArrow()
}

// tabindex="-1" still lets a click focus it, so stray clicks after rage would bring the ring back. Rapid clicks
// (detail > 1) would otherwise select the text around it on the way to rage.
const onArrowMouseDown = (event: MouseEvent) => {
  if (marioPhase.value !== 'hidden' || event.detail > 1) event.preventDefault()
}
</script>

<template>
  <div
    v-editable="block"
    class="flex flex-col gap-(--app-gutter-outer) overflow-clip"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top && marioPhase === 'hidden',
      // Doubled on mobile while Mario's out, for headroom over the box and his jumps
      'pt-[calc(var(--app-vertical-rhythm)*2)] md:pt-(--app-vertical-rhythm)':
        block.spacing_top && marioPhase !== 'hidden',
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
            class="relative z-2 block w-30 md:w-40 mx-auto select-none touch-manipulation transition-opacity duration-300 ease-outCubic"
            :class="{ 'cursor-default': marioPhase !== 'hidden', 'opacity-0 pointer-events-none': isArrowGone }"
            aria-label="Poke the arrow"
            :tabindex="marioPhase === 'hidden' ? undefined : -1"
            :aria-disabled="marioPhase !== 'hidden' || undefined"
            @mousedown="onArrowMouseDown"
            @click="onArrowClick"
          >
            <!-- On mobile it lifts clear on rage, so Mario has room to come out of the tail. Animated by liftArrow. -->
            <div
              ref="arrowLift"
              :class="{
                'transition-scale duration-150 ease-out hover:scale-102 active:scale-98': marioPhase === 'hidden',
                'max-md:-translate-y-32': isArrowLocked,
              }"
            >
              <!-- The shake sits inside the lift, so stopping it never touches the lift -->
              <div :class="marioPhase === 'raging' ? 'shake-3' : arrowShakeClass">
                <!-- Tail doubles as a pipe: upright and red while raging, until Mario is out -->
                <IconPixelArrow
                  class="w-full data-rage:[&_[fill='#24F456']]:fill-rage-light data-rage:[&_[fill='#00E640']]:fill-rage data-rage:[&_[fill='#00C340']]:fill-rage-dark"
                  :class="{ 'animate-bob rotate-(--tilt)': !isArrowLocked }"
                  :data-rage="isArrowLocked || undefined"
                />
              </div>
            </div>
          </button>
        </div>
      </div>

      <div
        ref="marioStage"
        class="relative -mt-[calc(var(--app-gutter-outer)*2.5)] md:mt-[calc(var(--app-gutter-outer)*0.5)] lg:mt-0"
        aria-hidden="true"
      >
        <!-- Solid from the start, but unseen until he hits it -->
        <div
          v-if="marioBox && marioPhase !== 'hidden'"
          ref="marioBoxEl"
          class="absolute top-0 left-0 size-10 md:size-12 select-none transition-opacity duration-150 ease-outCubic motion-reduce:transition-none"
          :class="{ 'opacity-0': marioBoxState === 'hidden' || marioPhase === 'resetting' }"
          :style="{ transform: marioBoxTransform }"
        >
          <IconMarioBoxEmpty
            v-if="marioBoxState === 'empty'"
            class="size-full"
            shape-rendering="crispEdges"
          />
          <IconMarioBox
            v-else
            class="size-full"
            shape-rendering="crispEdges"
          />
        </div>

        <UiMarioCoin
          v-for="coin in flyingCoins"
          :key="coin.id"
          :x="coin.x"
          :y="coin.y"
          @done="removeCoin(coin.id)"
        />

        <!-- Rises out of the box, then shares Mario's world; under him. He and it only mount on rage, so the page loads
             without them. -->
        <div
          v-if="marioPhase !== 'hidden'"
          ref="alien"
          class="absolute z-1 bottom-full left-0 w-20 md:w-24 aspect-[32/21] overflow-hidden select-none pointer-events-none transition-opacity duration-300 ease-outCubic"
          :class="{ invisible: !hasAlien, 'opacity-0': marioPhase === 'resetting' }"
        >
          <div
            ref="alienSheet"
            class="h-full w-max"
          >
            <IconMarioAlien
              class="h-full w-auto"
              shape-rendering="crispEdges"
            />
          </div>
        </div>

        <!-- Over a bumped word and its coins, under the pipe he comes out of -->
        <div
          v-if="marioPhase !== 'hidden'"
          ref="mario"
          class="absolute bottom-full left-0 size-10 md:size-12 overflow-hidden select-none cursor-pointer"
          :class="{
            invisible: marioPhase === 'raging',
            // In front of the steps below as he falls out of the viewport
            'z-10': marioPhase === 'dying',
            'z-1': marioPhase !== 'dying',
          }"
          @click="onMarioClick"
        >
          <div
            ref="marioSheet"
            class="h-full w-max"
          >
            <IconMarioSequence
              class="h-full w-auto text-accent"
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
            :class="
              !brick
                ? 'opacity-0'
                : marioPhase === 'resetting'
                  ? 'animate-brick-out'
                  : ['animate-brick-in', { '[--brick-rise:0]': brick.isUnder }]
            "
            :style="{ animationDelay: brick?.delay }"
          />
        </div>
      </div>
    </div>

    <!-- Only mounted once the pipe rages, so it can slide in when Mario lands -->
    <Teleport
      v-if="marioPhase !== 'hidden'"
      to="#teleports"
    >
      <UiGamepad
        ref="gamepad"
        :visible="isMarioPlayable"
        @press="pressMario"
        @release="releaseMario"
      />
    </Teleport>

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
