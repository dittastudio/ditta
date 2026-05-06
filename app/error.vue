<script lang="ts" setup>
import IconLogo from '@/assets/icons/ditta.svg'
import { VueLenis } from 'lenis/vue'

interface Props {
  error: {
    statusCode: number
    statusMessage: string
  }
}

const { error } = defineProps<Props>()

const message = computed(() =>
  error?.statusCode && error?.statusMessage ? `${error?.statusCode} ${error?.statusMessage}` : 'an unexpected error',
)

useHead({
  title: message.value.toLowerCase(),
})
</script>

<template>
  <VueLenis
    root
    :options="{
      duration: 1,
      autoRaf: true,
      anchors: {
        duration: 1,
        offset: 1,
      },
    }"
  >
    <div class="relative flex flex-col min-h-screen">
      <div class="sticky top-0">
        <UiTicker
          direction="right"
          spacing-classes="gap-30 px-15"
        >
          <template
            v-for="i in 8"
            :key="i"
          >
            <div class="text-display trim-both">404</div>
          </template>
        </UiTicker>
      </div>

      <div class="grow flex flex-col justify-center wrapper py-30">
        <div class="flex flex-col items-center justify-center text-center h-full gap-10">
          <h1 class="text-display">Mamma mia</h1>

          <p class="text-lead text-balance max-w-[30ch]">
            {{ message }}
          </p>

          <p class="text-lead text-balance max-w-[30ch]">
            Let’s head back to the homepage and pretend this never happened.
          </p>

          <NuxtLink to="/">
            <UiButton text="Return to safety" />
          </NuxtLink>
        </div>
      </div>
      <div class="absolute bottom-0 right-0 left-0 -z-1 drop-shadow-xl text-pink">
        <div class="wrapper">
          <IconLogo class="w-full h-auto" />
        </div>
      </div>
    </div>
  </VueLenis>
</template>
