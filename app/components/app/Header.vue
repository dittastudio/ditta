<script lang="ts" setup>
interface Props {
  tagline?: string
}

const { tagline } = defineProps<Props>()

const headerTheme = useHeaderTheme()
const textClass = computed(() => (headerTheme.value === 'dark' ? 'text-grey' : 'text-black'))
</script>

<template>
  <header :class="['absolute top-0 z-10 w-full transition-colors duration-1000 ease-out', textClass]">
    <div class="wrapper flex justify-between items-start pt-(--app-gutter-outer) md:pt-20">
      <p
        v-if="tagline"
        class="max-lg:hidden text-navigation"
      >
        {{ tagline }}
      </p>

      <slot />
    </div>
  </header>
</template>
