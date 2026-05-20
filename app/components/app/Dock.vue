<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core'
import { useLenis } from 'lenis/vue'
import type { ElementLink } from '#storyblok-components'
import type { Themes } from '@/types/app'
import IconLogo from '@/assets/icons/ditta.svg'
import IconBurger from '@/assets/icons/burger.svg'

interface Props {
  items?: ElementLink[]
}

const { items } = defineProps<Props>()

// Template refs
const dock = useTemplateRef('dock')
const wrapper = useTemplateRef('wrapper')

// Theme
const scrollTheme = useBlockTheme()
const activeTheme = computed(() => scrollTheme.value ?? 'dark')
const dockClasses: Record<Themes | 'navigationOpen', string> = {
  navigationOpen: 'bg-black text-grey outline outline-1 outline-white/15',
  dark: 'bg-black/50 text-grey outline outline-1 outline-white/15',
  light: 'bg-grey/50 text-black outline outline-1 outline-black/5',
  white: 'bg-grey/50 text-black outline outline-1 outline-black/5',
  pink: 'bg-pink/50 text-black outline outline-1 outline-black/5',
  beige: 'bg-beige/50 text-black outline outline-1 outline-black/5',
  mood: 'bg-mood/50 text-black outline outline-1 outline-black/5',
  olive: 'bg-olive/50 text-black outline outline-1 outline-black/5',
  accent: 'bg-accent/50 text-black outline outline-1 outline-black/5',
}

// Weather
const { data: weather } = useLazyFetch('/api/weather', { server: false })

// Navigation
const navigation = useNavigation()
const lenis = useLenis()
const route = useRoute()
const pendingAnchor = ref<string | null>(null)
const pendingScrollTop = ref(false)

const toggle = () => {
  navigation.value = !navigation.value
}

const handleNavClick = (e: MouseEvent) => {
  const anchor = (e.target as HTMLElement).closest('a')
  const hash = anchor?.hash

  if (hash && anchor.pathname === route.path) {
    e.preventDefault()
    pendingAnchor.value = hash
  } else if (!hash && route.path === '/' && anchor?.pathname === '/') {
    e.preventDefault()
    pendingScrollTop.value = true
  }

  navigation.value = false
}

onClickOutside(dock, () => {
  navigation.value = false
})

watch(navigation, async (isOpen) => {
  if (isOpen) {
    lenis.value?.stop()
  } else {
    lenis.value?.start()
    if (pendingAnchor.value) {
      const target = pendingAnchor.value
      pendingAnchor.value = null
      await nextTick()
      lenis.value?.scrollTo(target, { duration: 1 })
    }
    if (pendingScrollTop.value) {
      pendingScrollTop.value = false
      await nextTick()
      lenis.value?.scrollTo(0, { duration: 1 })
    }
  }
})

// Scroll
let lastScrollY = 0
const isHidden = ref(false)

const onScroll = () => {
  const y = window.scrollY
  const isDown = y >= 1 && y > lastScrollY

  if (navigation.value && isDown) navigation.value = false
  if (isHidden.value !== isDown) isHidden.value = isDown

  lastScrollY = y
}

// Lifecycle
onMounted(() => {
  if (wrapper.value) document.documentElement.style.setProperty('--dock-height', `${wrapper.value.offsetHeight}px`)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header class="fixed top-0 left-0 z-50 size-full pointer-events-none">
    <div
      ref="wrapper"
      class="wrapper pt-5"
    >
      <div
        class="w-full max-w-90 mx-auto rounded-20 corner-shape-squircle transition-[backdrop-filter,scale] duration-300 ease-out"
        :class="{
          'backdrop-blur-none scale-95': isHidden,
          'backdrop-blur-md scale-100': !isHidden,
        }"
      >
        <div
          class="shadow-2xl rounded-[inherit] corner-shape-inherit transition-opacity duration-300 ease-out"
          :class="{
            'opacity-0': isHidden,
            'opacity-100': !isHidden,
          }"
        >
          <div
            ref="dock"
            class="w-full rounded-[inherit] corner-shape-inherit transition-colors duration-300 ease-out"
            :class="dockClasses[navigation ? 'navigationOpen' : activeTheme]"
          >
            <div
              class="grid grid-cols-3 rounded-[inherit] corner-shape-inherit"
              :class="{ 'pointer-events-auto': !isHidden }"
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

              <button
                class="px-5 py-5"
                type="button"
                @click="toggle"
              >
                <IconBurger class="w-4 h-auto ml-auto" />
                <span class="sr-only">{{ navigation ? 'Close Menu' : 'Open Menu' }}</span>
              </button>
            </div>

            <UiExpandable
              :is-open="navigation"
              transition-classes="duration-500 ease-spring-1"
              :class="{
                'pointer-events-auto': !isHidden,
              }"
            >
              <nav
                data-lenis-prevent
                class="w-full pt-10 pb-14 flex flex-col gap-14 transition-opacity scroll-y max-h-[calc(100svh-var(--dock-height)-20px)] text-grey"
                :class="{
                  'opacity-0 duration-100 ease-out': !navigation,
                  'opacity-100 duration-500 ease-out delay-150': navigation,
                }"
                @click.capture="handleNavClick"
              >
                <ul
                  class="flex flex-col w-full text-28 text-center has-hover:[&_a:not(:hover)]:text-current/30 has-focus:[&_a:not(:focus)]:text-current/30"
                >
                  <li>
                    <NuxtLink
                      to="/"
                      class="block w-full transition-colors duration-300 ease-outCubic focus:outline-0"
                    >
                      Index
                    </NuxtLink>
                  </li>

                  <li
                    v-for="item in items"
                    :key="item._uid"
                  >
                    <StoryblokLink
                      :item="item.link"
                      class="block w-full transition-colors duration-300 ease-outCubic focus:outline-0"
                    >
                      {{ item.text }}
                    </StoryblokLink>
                  </li>
                </ul>

                <ul class="flex flex-col items-center justify-center gap-10 w-full">
                  <li>
                    <NuxtLink
                      to="mailto:hello@ditta.studio"
                      class="block"
                    >
                      <UiButton
                        text="Talk to us"
                        size="medium"
                        theme="light"
                      />
                    </NuxtLink>
                  </li>

                  <li>
                    <AppTheme />
                  </li>
                </ul>
              </nav>
            </UiExpandable>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
