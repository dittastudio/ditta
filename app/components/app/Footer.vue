<script lang="ts" setup>
import type { RichTextFieldValue } from '@storyblok/schema'
import IconRobot from '@/assets/icons/pixel-robot.svg'

interface Props {
  text?: RichTextFieldValue | null
}

const { text } = defineProps<Props>()

const email = 'hello@ditta.studio'

const rotation = ref(0)
const mouseXPercent = ref(50)
const mouseYPercent = ref(50)

const onMouseMove = (event: MouseEvent) => {
  rotation.value = (event.clientX / window.innerWidth) * 80 - 40
  mouseXPercent.value = (event.clientX / window.innerWidth) * 100
  mouseYPercent.value = (event.clientY / window.innerHeight) * 100
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <UiTheme
    tag="footer"
    theme="dark"
    id="contact"
    class="min-h-screen flex"
  >
    <div class="relative wrapper w-full pt-25 md:pt-(--app-gutter-outer) pb-10 flex flex-col justify-between gap-6">
      <div class="flex flex-col items-start lg:flex-row justify-between max-lg:grow">
        <div
          v-if="storyblokRichTextContent(text)"
          :class="[
            'prose',
            'text-pretty',
            'prose-h2:text-heading',
            'prose-h2:max-w-[18em]',
            'prose-p:text-lead',
            'prose-p:text-beige',
            'prose-p:max-w-[23em]',
          ]"
        >
          <StoryblokText :html="text" />
        </div>

        <div
          class="max-lg:grow max-lg:w-full flex flex-col items-center justify-center max-lg:py-[calc(var(--app-vertical-rhythm)*0.5)] gap-6"
        >
          <div
            class="footer__robot relative lg:left-[-2.5%] h-36 md:h-50 aspect-336/278 animate-bob"
            :style="{
              transform: `rotate(${rotation}deg)`,
              '--mouse-x-percent': mouseXPercent,
              '--mouse-y-percent': mouseYPercent,
            }"
          >
            <IconRobot class="w-full h-full" />

            <span class="footer__eye footer__eye--left" />
            <span class="footer__eye footer__eye--right" />
          </div>
        </div>
      </div>

      <a
        class="footer__link block whitespace-nowrap text-center"
        href="mailto:hello@ditta.studio"
        aria-label="Email Ditta at hello@ditta.studio"
      >
        <UiTextMorph
          :min-weight="400"
          :text="email"
        />
      </a>
    </div>
  </UiTheme>
</template>

<style scoped>
.footer__link {
  font-size: min(calc(9.5vw + 6px), 177px); /* magic number */
}

.footer__robot {
  container-type: size;
}

.footer__eye {
  position: absolute;
  width: 9%;
  height: 5%;
  background-color: black;
  top: 51.9%;
  left: 29%;
  transition: transform 0.05s ease;
  transform: translate(calc((var(--mouse-x-percent) - 50) * 0.04cqw), calc((var(--mouse-y-percent) - 50) * 0.04cqh));
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: inherit;
    rotate: 90deg;
    scale: 1;
    animation: footer-eye-blink 10.27s ease infinite;
  }
}

@keyframes footer-eye-blink {
  0%,
  24.51%,
  25.87%,
  64.68%,
  66.05%,
  67.98%,
  69.35%,
  100% {
    scale: 1;
  }

  25.19%,
  65.37%,
  68.67% {
    scale: 0 1;
  }
}

.footer__eye--left {
  left: 29%;
}

.footer__eye--right {
  left: 62%;
}
</style>
