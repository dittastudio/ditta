<script lang="ts" setup>
import type { MarioPhase } from '@/composables/useMario'
import type { Themes } from '@/types/app'
import type { Block } from '#storyblok-schema'
import { defineSound } from '@web-kits/audio'
import { boop, levelUp } from '@@/.web-kits/core'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
const lockupEl = computed(() => lockup.value?.$el as HTMLElement | undefined)
const marioSectionEl = useTemplateRef('marioSection')
const marioStageEl = useTemplateRef('marioStage')
const marioCeilingEl = useTemplateRef('marioCeiling')

// Everything of Mario's beyond this phase is fetched on the arrow's first poke, as few visitors ever get further. The
// phase lives here so the arrow can rage straight away, and StepsMario takes over reporting it once it's arrived.
const marioPhase = ref<MarioPhase>('hidden')
const marioScene = shallowRef<typeof import('@/components/block/StepsMario.vue').default | null>(null)
let marioLoad: Promise<void> | undefined

const loadMario = () => {
  marioLoad ??= import('@/components/block/StepsMario.vue')
    .then((module) => {
      marioScene.value = module.default
    })
    .catch(() => {
      // Back to a plain arrow. The next poke tries again, though Chrome remembers a failed import until a reload.
      marioLoad = undefined
      if (marioPhase.value === 'raging') marioPhase.value = 'hidden'
    })
}

const isArrowLocked = computed(() => marioPhase.value !== 'hidden') // upright and red from rage on, through its fade
// Mario's out of the tail, until the scene has cleared away after the alien gets him
const isArrowGone = computed(() => !['hidden', 'raging', 'piping'].includes(marioPhase.value))

const { play } = useAudio()
const soundBoop = defineSound(boop)
const soundLevelUp = defineSound(levelUp)

useMouseTilt(arrowEl, { paused: isArrowLocked })

const {
  shakeClass: arrowShakeClass,
  click: rageArrow,
  resetRage,
} = useRageClicks({
  onFirstClick: loadMario,
  onClick: () => play(soundBoop),
  onRage: () => {
    arrowEl.value?.blur() // it's done; otherwise Mario's arrow keys light up its focus ring
    play(soundLevelUp)
    marioPhase.value = 'raging'
    loadMario()
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

// Back from the alien: the arrow can be raged at all over again
watch(marioPhase, (phase) => phase === 'hidden' && resetRage())

const onArrowClick = () => {
  if (marioPhase.value === 'hidden') rageArrow()
}
</script>

<template>
  <div
    ref="marioCeiling"
    v-editable="block"
    class="steps__mario flex flex-col gap-(--app-gutter-outer) overflow-clip"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top && marioPhase === 'hidden',
      'pt-[max(var(--app-vertical-rhythm),var(--mario-headroom))]': block.spacing_top && marioPhase !== 'hidden',
      'pt-(--mario-headroom)': !block.spacing_top && marioPhase !== 'hidden',
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div
      ref="marioSection"
      class="flex flex-col gap-(--app-gutter-outer)"
    >
      <div class="wrapper grid grid-cols-1 md:grid-cols-12 gap-(--mario-copy-to-arrow) md:gap-5">
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
            class="tappable relative z-2 block w-(--mario-arrow-width) md:w-40 mx-auto transition-opacity duration-300 ease-outCubic"
            :class="{ 'cursor-default': marioPhase !== 'hidden', 'opacity-0 pointer-events-none': isArrowGone }"
            aria-label="Poke the arrow"
            :tabindex="marioPhase === 'hidden' ? undefined : -1"
            :aria-disabled="marioPhase !== 'hidden' || undefined"
            @mousedown.prevent
            @click="onArrowClick"
          >
            <!-- On mobile it lifts clear on rage, so Mario has room to come out of the tail. Animated by liftArrow, and the
                 translate transition carries it back down afterwards. -->
            <div
              ref="arrowLift"
              :class="{
                'pokeable [transition-property:scale,translate]!': marioPhase === 'hidden',
                'max-md:-translate-y-(--mario-lift)': isArrowLocked,
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

      <!-- Holds the bricks' height up front, so the page doesn't move when they arrive. On mobile they're offset up within
           reach of the copy, which leaves that space where it is, so the steps below stay clear of the arrow. -->
      <div
        ref="marioStage"
        class="relative h-(--mario-brick) max-md:bottom-(--mario-shift) md:mt-[calc(var(--app-gutter-outer)*0.5)] lg:mt-0"
        aria-hidden="true"
      >
        <component
          :is="marioScene"
          v-if="marioScene"
          :section="marioSectionEl"
          :stage="marioStageEl"
          :ceiling="marioCeilingEl"
          :lockup="lockupEl"
          :pipe="arrowLiftEl"
          :is-raged="marioPhase !== 'hidden'"
          @phase="marioPhase = $event"
        />
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

<style scoped>
@reference "@/assets/css/app.css";

.steps__mario {
  /* Everything in the scene is sized from this: 16 sprite px */
  --mario-brick: --spacing(10);

  /* Room above the heading, in sprite px: a 32 gap, a 16 box, a 21 alien and a 16 hop */
  --mario-headroom: calc(var(--mario-brick) * 85 / 16);

  /* The rest is mobile only */
  --mario-copy-to-arrow: --spacing(10);
  --mario-arrow-width: --spacing(30);

  /* From the arrow's artwork: 110x134, with the mouth at 130 */
  --mario-arrow-height: calc(var(--mario-arrow-width) * 134 / 110);
  --mario-arrow-to-mouth: calc(var(--mario-arrow-width) * 130 / 110);

  /* From the bottom of the copy to the bricks */
  --mario-gap: calc(var(--mario-brick) * 3);

  /* Raises the bricks to that gap */
  --mario-shift: calc(
    var(--mario-copy-to-arrow) + var(--mario-arrow-height) + var(--app-gutter-outer) - var(--mario-gap)
  );

  /* From the arrow's mouth to the bricks. At least a brick, or Mario slides out below them and snaps back up */
  --mario-drop: calc(var(--mario-brick) * 3);

  /* Raises the arrow to that drop */
  --mario-lift: calc(var(--mario-copy-to-arrow) + var(--mario-arrow-to-mouth) + var(--mario-drop) - var(--mario-gap));

  @variant md {
    --mario-brick: --spacing(12);
  }
}
</style>
