<script lang="ts" setup>
import type { SettingsStoryblok } from '@@/types/storyblok'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import IconDitta from '@/assets/icons/ditta.svg'

gsap.registerPlugin(SplitText)

const settings = await useStory('/settings')
const content = settings.value.content as SettingsStoryblok

const footerEmailRef = ref<HTMLElement | null>(null)
let splitText: SplitText | null = null

onMounted(() => {
  if (!footerEmailRef.value)
    return

  // Split text into characters
  splitText = new SplitText(footerEmailRef.value, {
    type: 'chars',
  })

  const chars = splitText.chars

  // Set initial styles
  gsap.set(chars, {
    fontVariationSettings: '"wght" 380, "ital" 0',
  })

  // Mouse move handler
  const handleMouseMove = (e: MouseEvent) => {
    const rect = footerEmailRef.value!.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const progress = mouseX / rect.width
    const hoveredIndex = Math.round(progress * (chars.length - 1))

    chars.forEach((char, index) => {
      const distance = Math.abs(index - hoveredIndex)

      let weight = 380
      let italic = 0

      if (distance === 0) {
        weight = 900 // Direct hover
        italic = 10 // Full italic
      }
      else if (distance === 1) {
        weight = 790 // Adjacent
        italic = 7 // Strong italic
      }
      else if (distance === 2) {
        weight = 670 // Second adjacent
        italic = 5 // Medium italic
      }
      else if (distance === 3) {
        weight = 570 // Third adjacent
        italic = 2 // Slight italic
      }

      gsap.to(char, {
        fontVariationSettings: `"wght" ${weight}, "ital" ${italic}`,
        duration: 0.3,
        ease: 'power2.out',
      })
    })
  }

  // Mouse leave handler
  const handleMouseLeave = () => {
    gsap.to(chars, {
      fontVariationSettings: '"wght" 380, "ital" 0',
      duration: 0.4,
      ease: 'power2.out',
    })
  }

  // Add event listeners
  footerEmailRef.value.addEventListener('mousemove', handleMouseMove)
  footerEmailRef.value.addEventListener('mouseleave', handleMouseLeave)
})

// Cleanup
onUnmounted(() => {
  if (splitText) {
    splitText.revert()
  }
})
</script>

<template>
  <div class="flex flex-col items-start justify-between min-h-screen">
    <UiTicker
      :copy="['Say Hello']"
      duration="65s"
      direction="right"
      is-last
    />

    <div class="wrapper py-[var(--app-outer-gutter)]">
      <div
        v-if="content"
        class="prose mb-16 [&_p]:max-w-[40ch]"
      >
        <StoryblokText :html="content.footer_copy" />

        <p>
          <a
            ref="footerEmailRef"
            href="mailto:hello@ditta.studio"
            class="inline-block p-4 -m-4"
          >
            hello@ditta.studio
          </a>
        </p>
      </div>

      <IconDitta class="block w-10 h-3.5 mb-4" />

      <p class="text-10 font-bold max-w-[40ch] text-balance opacity-20">
        ditta ltd. is a company registered in England and Wales with company number 15648076.
      </p>
    </div>
  </div>
</template>
