<script lang="ts" setup>
// The thank-you, once a brief's link has been clicked: at the end of the brief, and on the confirm page
interface Props {
  name?: string | null
}

const { name } = defineProps<Props>()

const firstName = computed(() => briefFirstName({ name: name ?? undefined }))

// True while the burger has been eaten and the next one hasn't arrived
const eaten = ref(false)
</script>

<template>
  <section class="flex flex-col items-center gap-10 text-center">
    <p class="mb-5 text-24 leading-tight text-balance trim-both md:mb-8 md:text-28">
      <span class="inline-grid">
        <span
          class="col-start-1 row-start-1 transition-opacity duration-200 ease-outCubic motion-reduce:transition-none"
          :class="{ 'opacity-0': eaten }"
          :aria-hidden="eaten"
        >
          Have a burger on us!
        </span>
        <span
          class="col-start-1 row-start-1 transition-opacity duration-200 ease-outCubic motion-reduce:transition-none"
          :class="{ 'opacity-0': !eaten }"
          :aria-hidden="!eaten"
        >
          Struth! Fancy another...?
        </span>
      </span>
    </p>

    <BriefBurger v-model:finished="eaten" />

    <h1
      class="text-24 leading-tight text-balance trim-both md:text-28"
      data-crumb-surface="text"
    >
      Thanks{{ firstName ? `, ${firstName}` : '' }}. We've got your brief.
    </h1>

    <p
      class="text-18 opacity-60 md:text-20"
      data-crumb-surface="text"
    >
      We'll reply within two working days to book a short call. A copy is on its way to your inbox.
    </p>
  </section>
</template>
