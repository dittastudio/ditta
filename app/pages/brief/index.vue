<script lang="ts" setup>
// The brief builder (docs/plans/brief-builder.md). Client-only: see routeRules in nuxt.config.ts.
useSeoMeta({
  title: 'Start a brief',
  description: 'Tell us about your project in a few quick questions, and we’ll reply within two working days.',
})

const appStore = useAppStore()

onMounted(() => {
  appStore.setTheme('dark')
})
</script>

<template>
  <div>
    <BriefShell />
  </div>
</template>
