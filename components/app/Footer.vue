<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'
</script>

<template>
  <div class="bg-offblack flex flex-col justify-between min-h-screen">
    <ElementMarquee
      background-color="offblack"
      text-color="pink"
      :copy="['Say Hello']"
      duration="65s"
      direction="right"
    />

    <div class="wrapper section w-full">
      <h2 class="text-20 lg:text-24 max-w-[40ch] text-balance mb-40">
        We're a new digital agency based in London bridging the gap between design and development.
      </h2>

      <p class="text-32 sm:text-40">
        <a
          class="text-pink ease-smooth hover:opacity-70 transition-opacity duration-200"
          href="mailto:hello@ditta.studio"
        >
          hello@ditta.studio
        </a>
      </p>

      <p class="text-18 max-w-[40ch] text-balance opacity-40 mb-64">
        Start your next project with us.
      </p>

      <IconDitta class="block w-[50px] h-[18px] mb-8" />

      <ul class="flex gap-8 mb-16">
        <li class="text-14">
          <a
            class="opacity-40 hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
            href="https://www.linkedin.com/company/dittastudio"
            target="_blank"
          >
            LinkedIn
          </a>
        </li>

        <li class="text-14">
          <a
            class="opacity-40 hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
            href="https://www.instagram.com/_dittastudio/"
            target="_blank"
          >
            Instagram
          </a>
        </li>
      </ul>

      <p class="text-12 max-w-[40ch] text-balance text-grey">
        ditta ltd. is a company registered in England and Wales with company number 15648076.
      </p>
    </div>
  </div>
</template>
