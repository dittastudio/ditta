<script lang="ts" setup>
import type { ElementLink } from '#storyblok-components'
import IconLogo from '@/assets/icons/ditta.svg'
import IconBurger from '@/assets/icons/burger.svg'

interface Props {
  items?: ElementLink[]
}

const { items } = defineProps<Props>()

const navigation = useNavigation()

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
      <div class="w-full xs:w-90 mx-auto text-white bg-black rounded-20 overflow-clip">
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
          class="grid w-full transition-[grid-template-rows] duration-300 ease-inOutCubic"
          :class="navigation ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div
            class="w-full overflow-clip min-h-0"
            :class="{ 'pointer-events-auto': !isHidden }"
          >
            <nav class="w-full py-10">
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
                <li>
                  <NuxtLink
                    to="mailto:hello@ditta.studio"
                    class="block py-5"
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
    </div>
  </header>
</template>
