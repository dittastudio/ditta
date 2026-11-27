<script lang="ts" setup>
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import type { Block } from '#storyblok-schema'
import type { Themes } from '@/types/app'
import IconLogo from '@/assets/icons/ditta.svg'
import { defineSound } from '@web-kits/audio'
import { expand, collapse, hover } from '@@/.web-kits/playful'

interface Props {
  items?: Block<'element_link'>[] | null
}

const { items } = defineProps<Props>()

const dock = useTemplateRef('dock')

const { data: weather } = useLazyFetch('/api/weather', { server: false })

type DockThemes = Themes | 'navigationOpen'

const dockBgClasses: Record<DockThemes, string> = {
  navigationOpen: 'bg-black outline outline-1 outline-ash',
  dark: 'bg-black/50 outline outline-1 outline-ash',
  light: 'bg-grey/50 outline outline-1 outline-black/5',
  white: 'bg-grey/50 outline outline-1 outline-black/5',
  pink: 'bg-pink/50 outline outline-1 outline-black/5',
  coral: 'bg-coral/50 outline outline-1 outline-black/5',
  beige: 'bg-beige/50 outline outline-1 outline-black/5',
  mood: 'bg-mood/50 outline outline-1 outline-black/5',
  olive: 'bg-olive/50 outline outline-1 outline-black/5',
  accent: 'bg-accent/50 outline outline-1 outline-black/5',
  crema: 'bg-crema/50 outline outline-1 outline-black/5',
  forest: 'bg-forest/50 outline outline-1 outline-black/5',
  grey: 'bg-grey/50 outline outline-1 outline-black/5',
}

const dockTextClasses: Record<DockThemes, string> = {
  navigationOpen: 'text-grey',
  dark: 'text-grey',
  light: 'text-black',
  white: 'text-black',
  pink: 'text-black',
  coral: 'text-black',
  beige: 'text-black',
  mood: 'text-black',
  olive: 'text-black',
  accent: 'text-black',
  crema: 'text-black',
  forest: 'text-black',
  grey: 'text-black',
}

const soundExpand = defineSound(expand)
const soundCollapse = defineSound(collapse)
const soundHover = defineSound(hover)
const { play, playHover } = useAudio()

const appStore = useAppStore()
const { theme, navigation } = storeToRefs(appStore)
const isDark = computed(() => theme.value === 'dark')
const isReady = ref(false)
const isClosing = ref(false)
let closingTimer: ReturnType<typeof setTimeout> | null = null

const dockBgStyles = computed(() => dockBgClasses[navigation.value ? 'navigationOpen' : theme.value])
const dockTextStyles = computed(() => dockTextClasses[navigation.value ? 'navigationOpen' : theme.value])

const isInteractive = computed(() => !isHidden.value && isReady.value)

const close = () => {
  appStore.setNavigation(false)
}

onClickOutside(dock, () => {
  if (navigation.value) close()
})

onKeyStroke('Escape', () => {
  if (navigation.value) close()
})

const delay = 270 // the colours' 100ms delay + 150ms, and a 20ms buffer

watch(navigation, (isOpen) => {
  if (isOpen) {
    play(soundExpand)
    if (closingTimer) clearTimeout(closingTimer)
    isClosing.value = false
  } else {
    play(soundCollapse)
    isClosing.value = true

    closingTimer = setTimeout(() => {
      isClosing.value = false
    }, delay)
  }
})

let lastScrollY = 0
const isHidden = ref(false)
const isShadowVisible = ref(false)
const shadowVisibleOffset = 20

const onScroll = () => {
  const y = window.scrollY
  const isDown = y >= 1 && y > lastScrollY
  const isScrollingUp = y < lastScrollY

  if (!navigation.value && isHidden.value !== isDown) {
    isHidden.value = isDown
  }

  isShadowVisible.value = isScrollingUp && y > shadowVisibleOffset

  lastScrollY = y
}

onMounted(async () => {
  if (dock.value) {
    appStore.setDockHeight(dock.value.clientHeight)
    appStore.setDockBottom(dock.value.getBoundingClientRect().bottom)
  }

  lastScrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })

  await wait(100)
  isReady.value = true
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))

defineExpose({
  close,
})
</script>

<template>
  <header class="fixed top-0 left-0 z-50 size-full pointer-events-none">
    <div class="wrapper pt-7.5">
      <div
        class="w-full max-w-90 mx-auto rounded-20 corner-shape-squircle transition-[backdrop-filter,scale] duration-quick ease-outCubic"
        :class="{
          'backdrop-blur-none scale-95': isHidden || !isReady,
          'backdrop-blur-sm scale-100': !isHidden && isReady,
        }"
      >
        <div
          class="relative rounded-[inherit] corner-shape-inherit transition-opacity duration-quick ease-outCubic before:absolute before:inset-0 before:rounded-[inherit] before:corner-shape-inherit before:shadow-2xl before:pointer-events-none before:transition-opacity before:duration-400 before:ease-outCubic"
          :class="{
            'opacity-0': isHidden || !isReady,
            'opacity-100': !isHidden && isReady,
            'before:opacity-0': !isShadowVisible,
            'before:opacity-100': isShadowVisible,
          }"
        >
          <div
            ref="dock"
            class="w-full relative overflow-visible rounded-[inherit] corner-shape-inherit transition-colors duration-hover ease-outCubic"
            :class="dockTextStyles"
          >
            <div
              class="absolute rounded-20 corner-shape-squircle -z-1 transition-[inset,background-color,outline-color]"
              :class="[
                dockBgStyles,
                navigation ? 'inset-[-10px_-10px_0px_-10px]' : 'inset-0',
                {
                  'duration-[250ms,150ms,150ms] ease-outCubic': !isClosing,
                  'duration-[250ms,150ms,150ms] delay-[0ms,100ms,100ms] ease-outCubic': isClosing,
                },
              ]"
            />

            <div
              class="w-full h-11 grid grid-cols-3 rounded-[inherit] corner-shape-inherit"
              :class="{ 'pointer-events-auto': isInteractive }"
            >
              <p class="flex items-center gap-1.5 pl-5">
                <ClientOnly fallback-tag="span">
                  <template #fallback>
                    🌧️ <span class="text-tiny">0&deg;C<span class="max-xs:sr-only"> — LDN</span></span>
                  </template>
                  {{ weather?.emoji ?? '🌧️' }}
                  <span class="text-tiny">
                    {{ weather?.temperature ?? 0 }}&deg;C<span class="max-xs:sr-only"> — LDN</span>
                  </span>
                </ClientOnly>
              </p>

              <NuxtLink
                to="/"
                class="flex flex-col items-center justify-center"
              >
                <IconLogo class="w-auto h-4" />
                <span class="sr-only">ditta</span>
              </NuxtLink>

              <div
                class="flex justify-end gap-1 p-1"
                :style="{ '--nav-button-tint': isDark || navigation ? '15%' : '5%' }"
              >
                <ActionAudioToggle
                  size="compact"
                  variant="plain"
                />

                <ActionNavigationToggle />
              </div>
            </div>

            <UiExpandable
              :is-open="navigation"
              :transition-classes="
                navigation
                  ? 'duration-450 ease-spring-1 motion-reduce:duration-0'
                  : 'duration-quick ease-outCubic motion-reduce:duration-0'
              "
              :class="{
                'pointer-events-auto': isInteractive,
              }"
            >
              <div
                class="dock__inner relative transition-opacity text-grey"
                :class="{
                  'opacity-0 duration-100 ease-outCubic': !navigation,
                  'opacity-100 duration-quick ease-outCubic delay-100': navigation,
                }"
              >
                <div
                  class="dock__scroll scroll-y text-grey py-10 flex flex-col gap-2"
                  data-lenis-prevent
                >
                  <nav class="w-full flex flex-col gap-14">
                    <ul
                      class="flex flex-col w-full text-28 text-center has-hover:[&_a:not(:hover)]:text-current/30 has-focus:[&_a:not(:focus)]:text-current/30"
                    >
                      <li
                        v-for="item in items"
                        :key="item._uid"
                      >
                        <StoryblokLink
                          :item="item.link"
                          prefetch-on="interaction"
                          class="block w-full transition-colors duration-hover ease-outCubic focus:outline-0"
                          @pointerenter="playHover($event, soundHover)"
                        >
                          {{ item.text }}
                        </StoryblokLink>
                      </li>
                    </ul>

                    <ul class="flex flex-col items-center justify-center gap-10 w-full">
                      <li>
                        <NuxtLink
                          to="/brief"
                          class="block"
                          prefetch-on="interaction"
                        >
                          <UiButton
                            text="Start a brief"
                            size="medium"
                            theme="light"
                          />
                        </NuxtLink>
                      </li>

                      <li>
                        <ActionAccent />
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </UiExpandable>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.dock__inner {
  --gradient-color: black;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: --spacing(16);
    pointer-events: none;
    background-image: linear-gradient(
      to bottom,
      --alpha(var(--gradient-color) / 100%) 0%,
      --alpha(var(--gradient-color) / 98.7%) 8.1%,
      --alpha(var(--gradient-color) / 95.1%) 15.5%,
      --alpha(var(--gradient-color) / 89.6%) 22.5%,
      --alpha(var(--gradient-color) / 82.5%) 29%,
      --alpha(var(--gradient-color) / 74.1%) 35.3%,
      --alpha(var(--gradient-color) / 64.8%) 41.2%,
      --alpha(var(--gradient-color) / 55%) 47.1%,
      --alpha(var(--gradient-color) / 45%) 52.9%,
      --alpha(var(--gradient-color) / 35.2%) 58.8%,
      --alpha(var(--gradient-color) / 25.9%) 64.7%,
      --alpha(var(--gradient-color) / 17.5%) 71%,
      --alpha(var(--gradient-color) / 10.4%) 77.5%,
      --alpha(var(--gradient-color) / 4.9%) 84.5%,
      --alpha(var(--gradient-color) / 1.3%) 91.9%,
      --alpha(var(--gradient-color) / 0%) 100%
    );
  }
}

.dock__scroll {
  max-height: calc(100svh - (var(--dock-height) + --spacing(15)));
}
</style>
