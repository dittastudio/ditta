<script lang="ts" setup>
interface Props {
  text?: string
}

const { text } = defineProps<Props>()

const appStore = useAppStore()
const taglineReady = ref(false)

onMounted(async () => {
  await wait(300)

  taglineReady.value = true
})

const taglineClass = computed(() => ({
  'text-white': appStore.getTheme === 'dark',
  'text-black': appStore.getTheme !== 'dark',
  'opacity-0 scale-95': !taglineReady.value,
  'opacity-100 scale-100': taglineReady.value,
}))
</script>

<template>
  <div
    class="w-full transition-[opacity,scale] duration-500 ease-out"
    :class="taglineClass"
  >
    <p class="wrapper text-center text-16 md:text-navigation transition-colors duration-500 ease-outCubic">
      {{ text }}
    </p>
  </div>
</template>
