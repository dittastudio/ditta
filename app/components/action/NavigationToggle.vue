<script lang="ts" setup>
import IconBurger from '@/assets/icons/burger.svg'

const appStore = useAppStore()
const { navigation } = storeToRefs(appStore)

const toggle = () => {
  appStore.setNavigation(!navigation.value)
}
</script>

<template>
  <UiNavButton
    square
    size="compact"
    variant="plain"
    :aria-label="navigation ? 'Close Menu' : 'Open Menu'"
    @click="toggle"
  >
    <IconBurger
      class="w-[17px] h-auto"
      aria-hidden="true"
    />
  </UiNavButton>
</template>
