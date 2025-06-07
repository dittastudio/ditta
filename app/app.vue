<script lang="ts" setup>
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
  titleTemplate: title => (title ? `${title} - ditta` : 'ditta'),
  robots: 'index, follow',
})

useScriptPlausibleAnalytics({
  domain: 'ditta.studio',
  extension: ['file-downloads', 'outbound-links'],
})
</script>

<template>
  <div>
    <NuxtPage />

    <AppFooter />

    <UiCursor />

    <DevOnly>
      <DevGuide />
    </DevOnly>
  </div>
</template>
