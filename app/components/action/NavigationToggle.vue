<script lang="ts" setup>
import IconBurger from '@/assets/icons/burger.svg'

const appStore = useAppStore()
const { theme, navigation } = storeToRefs(appStore)
const isDark = computed(() => theme.value === 'dark')

const toggle = () => {
  appStore.setNavigation(!navigation.value)
}
</script>

<template>
  <button
    class="group block"
    type="button"
    @click="toggle"
  >
    <span
      class="flex items-center justify-center w-12 h-full rounded-[16px] corner-shape-squircle transition-colors duration-300 ease-out"
      :class="{
        'group-hover:bg-current/15': isDark || navigation,
        'group-hover:bg-current/5': !isDark,
      }"
    >
      <IconBurger class="w-4 h-auto" />
      <span class="sr-only">{{ navigation ? 'Close Menu' : 'Open Menu' }}</span>
    </span>
  </button>
</template>
