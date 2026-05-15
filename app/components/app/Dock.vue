<script lang="ts" setup>
import type { ElementLink } from '#storyblok-components'
import IconLogo from '@/assets/icons/ditta.svg'
import IconBurger from '@/assets/icons/burger.svg'

interface Props {
  tagline?: string
  items?: ElementLink[]
}

const { tagline, items } = defineProps<Props>()

const navigation = useNavigation()

const toggle = () => {
  navigation.value = !navigation.value
}

const headerTheme = useHeaderTheme()
const themeClass = computed(() => (headerTheme.value === 'dark' ? 'text-white' : 'text-black'))
</script>

<template>
  <header
    class="fixed top-5 left-0 z-10 w-full"
    :class="themeClass"
  >
    <div class="wrapper text-center md:text-left flex items-center justify-between flex-col md:flex-row gap-8">
      <p
        v-if="tagline"
        class="order-2 md:order-1 text-16 md:text-navigation"
      >
        <NuxtLink
          class="block"
          to="/"
        >
          {{ tagline }}
        </NuxtLink>
      </p>

      <div class="w-full md:w-70 order-1 md:order-2 text-white bg-black rounded-20 overflow-clip">
        <div class="grid grid-cols-[100px_1fr_100px] md:grid-cols-[100px_100px] md:justify-between">
          <p class="flex items-center gap-1.5 pl-5">🌧️ <span class="text-tiny">21&deg;C</span></p>

          <NuxtLink
            to="/"
            class="flex flex-col items-center justify-center md:sr-only"
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
          class="grid w-full transition-[grid-template-rows] duration-300 ease-inOutCubic"
          :class="navigation ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-clip min-h-0">
            <nav class="flex flex-col items-center justify-center gap-10 w-full py-10">
              <ul class="flex flex-col w-full text-28 text-center">
                <li>
                  <NuxtLink
                    to="/"
                    class="block w-full"
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
                    class="block w-full"
                  >
                    {{ item.text }}
                  </StoryblokLink>
                </li>
              </ul>

              <NuxtLink to="mailto:hello@ditta.studio">
                <UiButton text="Talk to us" />
              </NuxtLink>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
