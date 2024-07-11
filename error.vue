<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'

definePageMeta({
  layout: false,
})

interface Props {
  error: {
    statusCode: number
    statusMessage: string
  }
}

const { error } = defineProps<Props>()

useHead({
  title:
    error?.statusCode && error?.statusMessage
      ? `${error?.statusCode} ${error?.statusMessage}`
      : 'An unexpected error occurred',
})
</script>

<template>
  <div class="w-full h-screen flex items-center justify-center">
    <div class="w-full max-w-md flex flex-col items-center justify-center gap-40 text-center">
      <h1>
        <a
          href="/"
          class="block"
        >
          <IconDitta class="block w-full max-w-[100px] h-auto text-pink" />
        </a>
      </h1>

      <p class="text-24 text-balance">
        Uh oh, there was a problem loading up this page.
      </p>

      <p>
        <a
          href="/"
          class="block text-pink"
        >
          Andiamo a casa mia <span>&rarr;</span>
        </a>
      </p>
    </div>
  </div>
</template>
