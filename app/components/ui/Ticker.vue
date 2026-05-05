<script lang="ts" setup>
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  duration?: string
  direction?: 'left' | 'right'
  spacingClasses?: string
}

const { direction = 'left', duration = '60s', spacingClasses = 'gap-80 px-40' } = defineProps<Props>()

const container = useTemplateRef('container')
const wrappers = useTemplateRef('wrappers')
const lists = useTemplateRef('lists')

let scrollTrigger: ScrollTrigger | null = null

onMounted(async () => {
  if (!container.value) {
    return
  }

  await nextTick()

  let lastProgress = 0

  scrollTrigger = ScrollTrigger.create({
    trigger: container.value,
    start: 'top bottom',
    end: 'bottom top',
    scrub: false,
    markers: false,
    onUpdate: (self) => {
      if (!container.value) {
        return
      }

      const progress = self.progress
      const isScrollingUp = progress < lastProgress

      // Update animation states
      if (wrappers.value) {
        wrappers.value.forEach((wrapper) => {
          wrapper.style.animationPlayState = isScrollingUp
            ? direction === 'left'
              ? 'running'
              : 'paused'
            : direction === 'left'
              ? 'paused'
              : 'running'
        })
      }

      if (lists.value) {
        lists.value.forEach((list) => {
          list.style.animationPlayState = isScrollingUp
            ? direction === 'left'
              ? 'paused'
              : 'running'
            : direction === 'left'
              ? 'running'
              : 'paused'
        })
      }

      lastProgress = progress

      gsap.to(container.value, {
        x:
          direction === 'left'
            ? -container.value.clientWidth * (progress / 3) + 1
            : container.value.clientWidth * (progress / 3) - 1,
      })
    },
  })
})

onBeforeUnmount(() => {
  if (scrollTrigger) {
    scrollTrigger.kill()
    scrollTrigger = null
  }

  // Reset GSAP properties
  if (container.value) {
    gsap.set(container.value, { clearProps: 'all' })
  }
})
</script>

<template>
  <div class="ui-ticker relative contain-layout w-full isolate">
    <ul
      ref="container"
      class="flex justify-center transform-gpu"
    >
      <li
        v-for="i in 4"
        :key="i"
        ref="wrappers"
        class="ui-ticker__wrapper min-w-full shrink-0 transform-gpu"
      >
        <div
          ref="lists"
          class="ui-ticker__list select-none flex justify-center shrink-0 min-w-full transform-gpu"
        >
          <div
            :class="spacingClasses"
            class="flex shrink-0 items-center justify-around min-w-full"
          >
            <slot />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.ui-ticker {
  --duration: v-bind(duration);
}

.ui-ticker__wrapper {
  animation: ticker-right var(--duration) linear infinite paused;
}

.ui-ticker__list {
  animation: ticker-left var(--duration) linear infinite paused;
}

@keyframes ticker-left {
  0% {
    translate: 0 0 0;
  }

  100% {
    translate: -100% 0 0;
  }
}

@keyframes ticker-right {
  0% {
    translate: 0 0 0;
  }

  100% {
    translate: 100% 0 0;
  }
}
</style>
