<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'

const socialLinks = [
  {
    url: 'https://www.linkedin.com/company/dittastudio',
    text: 'LinkedIn',
  },
  {
    url: 'https://www.instagram.com/_dittastudio/',
    text: 'Instagram',
  },
]
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

    <div class="wrapper py-40">
      <h2 class="text-20 sm:text-24 max-w-[40ch] text-balance mb-40">
        We're a new digital agency based in London bridging the gap between design and development.
      </h2>

      <p class="text-24 xs:text-40">
        <a
          class="text-pink ease-smooth hover:opacity-70 transition-opacity duration-200"
          href="mailto:hello@ditta.studio"
        >
          hello@ditta.studio
        </a>
      </p>

      <p class="text-18 max-w-[40ch] text-balance opacity-50 mb-64">
        Start your next project with us.
      </p>

      <IconDitta class="block w-[50px] h-[18px] mb-8" />

      <ul class="flex gap-8 mb-16">
        <li
          v-for="link in socialLinks"
          :key="link.url"
          class="text-14"
        >
          <a
            :href="link.url"
            class="hover:opacity-100 hover:text-pink focus:opacity-100 text-offwhite/50 transition-colors duration-200"
            target="_blank"
          >
            {{ link.text }}
          </a>
        </li>
      </ul>

      <p class="text-12 max-w-[60ch] text-balance text-offwhite/20">
        ditta ltd. is a company registered in England and Wales with company number 15648076.
      </p>
    </div>
  </div>
</template>
