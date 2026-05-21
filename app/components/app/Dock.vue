<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core'
import type { ElementLink } from '#storyblok-components'
import type { Themes } from '@/types/app'
import IconLogo from '@/assets/icons/ditta.svg'
import IconBurger from '@/assets/icons/burger.svg'

interface Props {
  items?: ElementLink[]
}

const { items } = defineProps<Props>()

const dock = useTemplateRef('dock')
const wrapper = useTemplateRef('wrapper')

const blockTheme = useBlockTheme()
const activeTheme = computed(() => blockTheme.value || 'dark')
const isDark = computed(() => activeTheme.value === 'dark')
const isReady = ref(false)
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

const { data: weather } = useLazyFetch('/api/weather', { server: false })
const navigation = useNavigation()

const toggle = () => {
  navigation.value = !navigation.value
}

const close = () => {
  navigation.value = false
}

onClickOutside(dock, () => {
  navigation.value = false
})

let lastScrollY = 0
const isHidden = ref(false)

const onScroll = () => {
  const y = window.scrollY
  const isDown = y >= 1 && y > lastScrollY

  if (!navigation.value) {
    if (isHidden.value !== isDown) isHidden.value = isDown
  }

  lastScrollY = y
}

onMounted(async () => {
  if (wrapper.value) {
    document.documentElement.style.setProperty('--dock-height', `${wrapper.value.offsetHeight}px`)
  }

  lastScrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })

  await wait(250)
  isReady.value = true
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))

defineExpose({
  close,
})
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
          'backdrop-blur-none scale-95': isHidden || !isReady,
          'backdrop-blur-md scale-100': !isHidden && isReady,
        }"
      >
        <div
          class="shadow-2xl rounded-[inherit] corner-shape-inherit transition-opacity duration-300 ease-out"
          :class="{
            'opacity-0': isHidden || !isReady,
            'opacity-100': !isHidden && isReady,
          }"
        >
          <div
            ref="dock"
            class="w-full rounded-[inherit] corner-shape-inherit transition-colors duration-300 ease-out"
            :class="dockClasses[navigation ? 'navigationOpen' : activeTheme]"
          >
            <div
              class="grid grid-cols-3 rounded-[inherit] corner-shape-inherit"
              :class="{ 'pointer-events-auto': !isHidden && isReady }"
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

              <div>
                <button
                  class="group ml-auto block p-1"
                  type="button"
                  @click="toggle"
                >
                  <span
                    class="block p-4 rounded-[16px] corner-shape-squircle transition-colors duration-300 ease-out"
                    :class="{
                      'group-hover:bg-current/15': isDark || navigation,
                      'group-hover:bg-current/5': !isDark,
                    }"
                  >
                    <IconBurger class="w-4 h-auto ml-auto" />
                    <span class="sr-only">{{ navigation ? 'Close Menu' : 'Open Menu' }}</span>
                  </span>
                </button>
              </div>
            </div>

            <UiExpandable
              :is-open="navigation"
              transition-classes="duration-500 ease-spring-1"
              :class="{
                'pointer-events-auto': !isHidden && isReady,
              }"
            >
              <nav
                data-lenis-prevent
                class="w-full pt-10 pb-14 flex flex-col gap-14 transition-opacity scroll-y max-h-[calc(100svh-var(--dock-height)-20px)] text-grey"
                :class="{
                  'opacity-0 duration-100 ease-out': !navigation,
                  'opacity-100 duration-500 ease-out delay-150': navigation,
                }"
              >
                <ul
                  class="flex flex-col w-full text-28 text-center has-hover:[&_a:not(:hover)]:text-current/30 has-focus:[&_a:not(:focus)]:text-current/30"
                >
                  <li>
                    <NuxtLink
                      to="/"
                      class="relative block w-full transition-colors duration-300 ease-outCubic focus:outline-0 font-fallback"
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
