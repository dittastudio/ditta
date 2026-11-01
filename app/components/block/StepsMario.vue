<script lang="ts" setup>
import type { MarioPhase } from '@/composables/useMario'

import { SIZE } from '@/utils/mario/physics'

import IconMarioAlien from '@/assets/icons/mario-alien.svg'
import IconMarioBoxEmpty from '@/assets/icons/mario-box-empty.svg'
import IconMarioBox from '@/assets/icons/mario-box.svg'
import IconMarioBrick from '@/assets/icons/mario-brick.svg'
import IconMarioSequence from '@/assets/icons/mario-sequence.svg'

interface Props {
  section: HTMLElement | null | undefined // Mario's keys and the page restrictions apply while any of it shows
  stage: HTMLElement | null | undefined // this renders inside it
  ceiling: HTMLElement | null | undefined // its top edge is as high as he can go
  lockup: HTMLElement | null | undefined
  pipe: HTMLElement | null | undefined
  isRaged: boolean // he comes out when this turns true, and it stays true until he's reported back as hidden
}

const { section, stage, ceiling, lockup, pipe, isRaged } = defineProps<Props>()

const emit = defineEmits<{
  phase: [phase: MarioPhase]
}>()

const gamepad = useTemplateRef('gamepad')

const {
  phase,
  isPlayable,
  isOnScreen,
  bricks,
  box,
  boxState,
  flyingCoins,
  removeCoin,
  hasAlien,
  start,
  press,
  release,
} = useMario({
  section: () => section,
  stage: () => stage,
  ceiling: () => ceiling,
  sprite: useTemplateRef('mario'),
  sheet: useTemplateRef('marioSheet'),
  lockup: () => lockup,
  box: useTemplateRef('marioBoxEl'),
  pipe: () => pipe,
  alien: useTemplateRef('alien'),
  alienSheet: useTemplateRef('alienSheet'),
  gamepad: () => gamepad.value?.$el as HTMLElement | undefined,
})

useMarioPageGuards(isOnScreen)

// Sync, so the block's layout moves with him rather than a tick behind
watch(phase, (value) => emit('phase', value), { flush: 'sync' })

// Immediate, as the first rage can land while this is still on its way
watch(
  () => isRaged,
  (raged) => raged && start(),
  { immediate: true },
)

// In its own size, a brick, so it holds at every breakpoint
const boxTransform = computed(() =>
  box.value ? `translate(${(box.value.left / SIZE) * 100}%, ${(box.value.top / SIZE) * 100}%)` : undefined,
)

const appStore = useAppStore()
const { isAudioOn } = useAudio()
const soundPowerUp = defineSample('/sounds/smb_powerup.opus')

// Ready by the time he's clickable: loads alongside his other sounds, once the arrow rages
watch([isAudioOn, phase], ([on, value]) => on && value !== 'hidden' && soundPowerUp.load())

const onMarioClick = () => {
  appStore.cycleAccent()
  void soundPowerUp.play()
}
</script>

<template>
  <!-- Solid from the start, but unseen until he hits it -->
  <div
    v-if="box && phase !== 'hidden'"
    ref="marioBoxEl"
    class="absolute top-0 left-0 size-10 md:size-12 select-none transition-opacity duration-150 ease-outCubic motion-reduce:transition-none"
    :class="{ 'opacity-0': boxState === 'hidden' || phase === 'resetting' }"
    :style="{ transform: boxTransform }"
  >
    <IconMarioBoxEmpty
      v-if="boxState === 'empty'"
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

  <!-- Rises out of the box, then shares Mario's world; under him -->
  <div
    v-if="phase !== 'hidden'"
    ref="alien"
    class="absolute z-1 bottom-full left-0 w-20 md:w-24 aspect-[32/21] overflow-hidden select-none pointer-events-none transition-opacity duration-300 ease-outCubic"
    :class="{ invisible: !hasAlien, 'opacity-0': phase === 'resetting' }"
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
    v-if="phase !== 'hidden'"
    ref="mario"
    class="absolute bottom-full left-0 size-10 md:size-12 overflow-hidden select-none cursor-pointer"
    :class="{
      invisible: phase === 'raging',
      // In front of the steps below as he falls out of the viewport
      'z-10': phase === 'dying',
      'z-1': phase !== 'dying',
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

  <!-- Bricks only render once the stage is measured; the stage holds their height until then -->
  <div class="flex justify-center h-full overflow-x-clip">
    <IconMarioBrick
      v-for="(brick, index) in bricks"
      :key="index"
      class="size-10 md:size-12 shrink-0 motion-reduce:[--brick-rise:0]"
      :class="
        !brick
          ? 'opacity-0'
          : phase === 'resetting'
            ? 'animate-brick-out'
            : ['animate-brick-in', { '[--brick-rise:0]': brick.isUnder }]
      "
      :style="{ animationDelay: brick?.delay }"
    />
  </div>

  <!-- Only mounted once the pipe rages, so it can slide in when Mario lands -->
  <Teleport
    v-if="phase !== 'hidden'"
    to="#teleports"
  >
    <UiGamepad
      ref="gamepad"
      :visible="isPlayable"
      @press="press"
      @release="release"
    />
  </Teleport>
</template>
