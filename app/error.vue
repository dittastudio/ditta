<script lang="ts" setup>
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
  <div class="w-full h-screen flex items-center justify-center px-4 sm:px-6 py-24">
    <div class="w-full max-w-md flex flex-col items-center justify-center gap-8 text-center">
      <h1>
        <a
          href="/"
          class="block"
        >
          ditta
        </a>
      </h1>

      <p class="text-24">
        Sorry, the page you were looking for couldn't be found. It may have been moved or deleted.
      </p>

      <p>
        <a
          href="/"
          class="block"
        >
          Back to home
        </a>
      </p>
    </div>
  </div>
</template>
