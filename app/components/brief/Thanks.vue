<script lang="ts" setup>
// The thank-you, once a brief's link has been clicked: at the end of the brief, and on the confirm page
interface Props {
  name?: string | null
}

const { name } = defineProps<Props>()

const firstName = computed(() => name?.trim().split(/\s+/)[0] ?? '')

// True while the burger has been eaten and the next one hasn't arrived
const eaten = ref(false)
</script>

<template>
  <section class="flex flex-col items-center gap-10 text-center">
    <!-- Both lines share one grid cell and cross over in place. The hidden one is aria-hidden, so screen readers only
         find the line that's showing. -->
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

    <!-- Crumbs from the burger land on the heading and paragraph, line by line -->
    <h1
      class="text-24 leading-tight text-balance trim-both md:text-28"
      data-crumb-surface="text"
    >
      Thanks{{ firstName ? `, ${firstName}` : '' }}. Your brief is on its way.
    </h1>

    <p
      class="text-18 opacity-60 md:text-20"
      data-crumb-surface="text"
    >
      We'll reply within two working days to book a short call.
    </p>
  </section>
</template>
