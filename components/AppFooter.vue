<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'
</script>

<template>
  <div class="flex flex-col items-start justify-between min-h-screen">
    <BlockHeading
      :copy="['Say Hello']"
      duration="65s"
      direction="right"
      is-last
    />

    <div class="wrapper py-[var(--app-outer-gutter)]">
      <div class="type-fluid-sm max-w-[40ch] text-balance [&_*+p]:mt-[1.3em]">
        <h2>
          We’re a digital agency that focuses on crafting websites that work as well as they look.
        </h2>

        <p>
          If you would like to discuss a project or find out more about us, please get in touch.
        </p>

        <p class="mb-64">
          <a
            class="transition-opacity duration-300 ease-out hover:opacity-60"
            href="mailto:hello@ditta.studio"
          >
            hello@ditta.studio
          </a>
        </p>
      </div>

      <IconDitta class="block w-[40px] h-[14px] mb-8" />

      <p class="text-10 font-bold max-w-[40ch] text-balance opacity-20">
        ditta ltd. is a company registered in England and Wales with company number 15648076.
      </p>
    </div>
  </div>
</template>
