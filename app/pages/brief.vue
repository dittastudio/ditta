<script lang="ts" setup>
// Prototype of the brief builder (M1 in docs/plans/brief-builder-milestones.md). Client-only and not linked anywhere.
useSeoMeta({
  title: 'Start a brief',
  robots: 'noindex, nofollow',
})

const appStore = useAppStore()

onMounted(() => {
  appStore.setTheme('light')
})
</script>

<template>
  <BriefShell />
</template>
