<script lang="ts" setup>
interface Props {
  tagline?: string
}

const { tagline } = defineProps<Props>()

const headerTheme = useHeaderTheme()
const textClass = computed(() => (headerTheme.value === 'dark' ? 'text-white' : 'text-black'))
</script>

<template>
  <header
    class="absolute top-0 z-10 overflow-x-clip w-full transition-colors duration-1000 ease-out"
    :class="textClass"
  >
    <div class="wrapper flex justify-between items-start pt-(--app-gutter-outer) md:pt-20">
      <p
        v-if="tagline"
        class="max-lg:hidden text-navigation"
      >
        <NuxtLink
          class="block p-5 -m-5 relative z-1"
          to="/"
        >
          {{ tagline }}
        </NuxtLink>
      </p>

      <slot />
    </div>
  </header>
</template>
