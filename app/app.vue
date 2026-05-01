<script setup lang="ts">
import type { Settings } from '#storyblok-components'

const story = await useStory<Settings>('/settings')
const route = useRoute()

const globalClasses = computed(() => ({
  'is-storyblok-editor': storyblokEditor(route.query),
}))

useHead({
  htmlAttrs: {
    class: globalClasses,
  },
})

useSeoMeta({
  titleTemplate: (title) => (title ? `${title} - ditta` : 'ditta'),
  robots: 'index, follow',
})

const bgColours = [
  'bg-white',
  'bg-black',
  'bg-pink',
  'bg-beige',
  'bg-grey',
  'bg-olive',
  'bg-forest',
  'bg-mood',
  'bg-crema',
]

const services = [
  'Full lifecycle',
  'AI Implementation',
  'MVP',
  'Digital consultancy',
  'SaaS',
  'Prototyping',
  'eCommerce',
  'Web development',
  'Content Management',
  'Headless CMS',
  'Marketing websites',
  'Integrations',
  'Deployment',
  'Experiences',
  'Web design',
]
</script>

<template>
  <div>
    <BlockHero />

    <NuxtPage />

    <div class="bg-black text-grey">
      <div class="wrapper py-10">
        <ul class="flex flex-wrap gap-5">
          <li
            v-for="bgColour in bgColours"
            :class="bgColour"
            class="aspect-square w-30 rounded-20 p-2 flex flex-col items-end justify-end"
          >
            <div
              class="inline-block px-1.5 py-0.5 font-[monospace] text-[12px] rounded-20 bg-white/60 text-black border border-current/10 shadow-md"
            >
              .{{ bgColour }}
            </div>
          </li>
        </ul>

        <div class="mt-20 flex flex-col items-start gap-10">
          <p class="text-14">.Mono</p>

          <h1 class="text-display">Display</h1>
          <h2 class="text-title">Title</h2>
          <h3 class="text-heading">Heading</h3>
          <h4 class="text-subheading">Subheading</h4>
          <p class="text-lead">
            Lead: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.
          </p>
          <p class="text-body">
            Body: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.
          </p>

          <ul class="flex flex-wrap gap-5">
            <li v-for="service in services">
              <UiChip
                :text="service"
                theme="light"
                size="large"
              />
            </li>
          </ul>

          <ul class="flex flex-wrap gap-5">
            <li>
              <UiChip
                text="Storyblok CMS"
                theme="light"
                size="medium"
              />
            </li>

            <li>
              <UiChip
                text="Shopify"
                theme="light"
                size="medium"
              />
            </li>

            <li>
              <UiChip
                text="Vue / Nuxt"
                theme="light"
                size="medium"
              />
            </li>
          </ul>

          <ul class="flex flex-wrap gap-5">
            <li>
              <UiButton
                text="Say hello"
                theme="light"
              />
            </li>

            <li>
              <UiButton
                text="Talk to a human"
                theme="light"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>

    <AppFooter :text="story.content.footer_copy_v2" />
  </div>
</template>
