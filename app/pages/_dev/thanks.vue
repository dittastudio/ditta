<script lang="ts" setup>
// Dev only (see $production in nuxt.config.ts): the brief's thank-you, without sending a brief to reach it.
// ?name=Sam sets the name, and ?name= leaves it out.
definePageMeta({ tagline: false })
useSeoMeta({ robots: 'noindex, nofollow' })

const route = useRoute()
const name = computed(() => (typeof route.query.name === 'string' ? route.query.name : 'Sam Taylor'))

const appStore = useAppStore()

onMounted(() => {
  appStore.setTheme('dark')
})
</script>

<template>
  <div class="flex min-h-svh flex-col bg-black text-white">
    <div class="wrapper flex flex-1 flex-col justify-center py-(--brief-nav-space)">
      <div class="mx-auto flex w-full max-w-174 flex-col items-center gap-8 text-center md:gap-10">
        <BriefThanks :name="name" />
      </div>
    </div>
  </div>
</template>
