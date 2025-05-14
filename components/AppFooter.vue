<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'
</script>

<template>
  <div class="flex flex-col justify-between min-h-screen">
    <BlockHeading
      background-color="black"
      text-color="pink"
      :copy="['Say Hello']"
      duration="65s"
      direction="right"
    />

    <div class="w-full wrapper py-[var(--app-outer-gutter)]">
      <h2 class="text-20 lg:text-24 max-w-[40ch] text-balance mb-40">
        We're a new digital agency based in London bridging the gap between design and development.
      </h2>

      <p class="text-32 sm:text-38">
        <a
          class="transition-opacity duration-200 ease-smooth hover:opacity-70"
          href="mailto:hello@ditta.studio"
        >
          hello@ditta.studio
        </a>
      </p>

      <p class="text-18 max-w-[40ch] text-balance opacity-40 mb-64">
        Start your next project with us.
      </p>

      <IconDitta class="block w-[50px] h-[18px] mb-8" />

      <p class="text-10 max-w-[40ch] text-balance opacity-20">
        ditta ltd. is a company registered in England and Wales with company number 15648076.
      </p>
    </div>
  </div>
</template>
