<script lang="ts" setup>
import { isStoryblokEditor } from '@/utilities/helpers'
import IconDitta from '@/assets/icons/ditta.svg'

const route = useRoute()

const globalClasses = computed(() => ({
  'is-storyblok-editor': isStoryblokEditor(route.query),
}))

useHead({
  htmlAttrs: {
    class: globalClasses,
  },
})

useSeoMeta({
  titleTemplate: title => (title ? `${title} - ditta` : 'ditta'),
  robots: 'index, follow',
})
</script>

<template>
  <div data-component="App">
    <LayoutApp>
      <template #header>
        <!-- <AppHeader /> -->
      </template>

      <template #main>
        <NuxtPage />
      </template>

      <template #footer>
        <div class="w-full bg-offblack text-white p-32 sm:p-48 lg:p-64">
          <h2 class="text-20 lg:text-24 max-w-[40ch] text-balance mb-40">
            We're a new digital agency based in London bridging the gap between design and dev.
          </h2>

          <p class="text-32 sm:text-38">
            <a class="text-pink" href="mailto:hello@ditta.studio">hello@ditta.studio</a>
          </p>

          <p class="text-18 max-w-[40ch] text-balance text-white/40 mb-64">
            Start your next project with us.
          </p>

          <IconDitta class="block w-[50px] h-[18px] mb-8 text-white" />

          <p class="text-10 max-w-[40ch] text-balance text-grey">
            ditta ltd. is a company registered in England and Wales with company number 15648076.
          </p>
        </div>
      </template>
    </LayoutApp>
  </div>
</template>