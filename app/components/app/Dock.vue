<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core'
import type { ElementLink } from '#storyblok-components'
import IconLogo from '@/assets/icons/ditta.svg'
import IconBurger from '@/assets/icons/burger.svg'

interface Props {
  items?: ElementLink[]
}

const { items } = defineProps<Props>()

const navigation = useNavigation()
const dock = useTemplateRef('dock')

onClickOutside(dock, () => {
  navigation.value = false
})

const toggle = () => {
  navigation.value = !navigation.value
}

const isHidden = ref(false)

let lastScrollY = 0

const onScroll = () => {
  const y = window.scrollY
  const isDown = y >= 1 && y > lastScrollY

  if (navigation.value && isDown) {
    navigation.value = false
  }

  isHidden.value = isDown
  lastScrollY = y
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header class="fixed top-0 left-0 z-50 size-full pt-5 pointer-events-none">
    <div
      class="wrapper transition-[opacity,translate] duration-300 ease-outCubic"
      :class="[{ '-translate-y-2 opacity-0': isHidden }]"
    >
      <div
        ref="dock"
        class="w-full xs:w-90 mx-auto text-white bg-black rounded-20 overflow-clip"
      >
        <div
          class="grid grid-cols-3"
          :class="{ 'pointer-events-auto': !isHidden }"
        >
          <p class="flex items-center gap-1.5 pl-5">
            🌧️ <span class="text-tiny">21&deg;C<span class="max-xs:sr-only"> — LDN</span></span>
          </p>

          <NuxtLink
            to="/"
            class="flex flex-col items-center justify-center"
          >
            <IconLogo class="w-auto h-4" />
            <span class="sr-only">ditta</span>
          </NuxtLink>

          <button
            class="px-5 py-4"
            type="button"
            @click="toggle"
          >
            <IconBurger class="w-4 h-auto ml-auto" />
          </button>
        </div>

        <div
          class="w-full h-0 overflow-clip transition-[height] duration-500 ease-inOutQuint"
          :class="{ 'h-auto starting:h-0': navigation, 'pointer-events-auto': !isHidden }"
        >
          <nav class="w-full pt-10 pb-14 flex flex-col gap-14">
            <ul
              class="flex flex-col w-full text-28 text-center has-hover:[&_a:not(:hover)]:text-mood has-focus:[&_a:not(:focus)]:text-mood"
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
                  />
                </NuxtLink>
              </li>
              <li>
                <AppTheme />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </header>
</template>
