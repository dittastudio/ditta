<script lang="ts" setup>
import IconLogo from '@/assets/icons/ditta.svg'

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
  <div class="relative flex flex-col min-h-screen">
    <div class="grow flex flex-col justify-center wrapper py-30">
      <div class="flex flex-col items-center justify-center text-center h-full gap-10">
        <NuxtLink
          to="/"
          class="block w-40 h-auto"
        >
          <IconLogo class="w-full h-auto" />
        </NuxtLink>

        <p class="text-lead text-balance max-w-[30ch]">
          {{ message }}
        </p>

        <NuxtLink to="/">
          <UiButton
            text="Return to home"
            size="medium"
          />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
