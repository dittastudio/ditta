<script lang="ts" setup>
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import IconDitta from '@/assets/icons/ditta.svg'

gsap.registerPlugin(ScrollTrigger)

const logoRefTop = ref<HTMLElement | null>(null)
const logoRefBottom = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const contentInnerRef = ref<HTMLElement | null>(null)
const bottomSectionRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const tlTop = gsap.timeline({
    scrollTrigger: {
      trigger: contentRef.value,
      start: 'top bottom',
      end: '20% bottom',
      scrub: true,
      markers: false,
    },
  })

  tlTop.fromTo(logoRefTop.value, {
    scale: 1,
    opacity: 1,
  }, {
    scale: 0.9,
    opacity: 0,
    ease: 'power2.inOut',
  })
    .fromTo(logoRefBottom.value, {
      scale: 1,
    }, {
      scale: 0.9,
      ease: 'power2.inOut',
    }, '<')

  const tlContentInner = gsap.timeline({
    scrollTrigger: {
      trigger: contentRef.value,
      start: 'top 75%',
      end: '15% 75%',
      scrub: true,
      markers: false,
    },
  })

  tlContentInner.fromTo(contentInnerRef.value, {
    scale: 1.25,
    transformOrigin: 'top center',
  }, {
    scale: 1,
    ease: 'power2.out',
  })

  const tlBottom = gsap.timeline({
    scrollTrigger: {
      trigger: bottomSectionRef.value,
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: true,
      markers: false,
    },
  })

  tlBottom.to(logoRefTop.value, {
    scale: 1,
    opacity: 1,
    ease: 'power2.inOut',
  }).to(logoRefBottom.value, {
    scale: 1,
    ease: 'power2.inOut',
  }, '<')
})
</script>

<template>
  <div>
    <div
      ref="logoRefTop"
      class="sticky top-0 z-10 min-h-svh flex items-end justify-center p-[var(--app-outer-gutter)] pointer-events-none"
    >
      <IconDitta
        class="page-header__logo w-full h-auto"
      />
    </div>

    <div
      ref="logoRefBottom"
      class="-mt-[100svh] sticky top-0 min-h-svh flex items-end justify-center p-[var(--app-outer-gutter)]"
    >
      <IconDitta
        class="page-header__logo w-full h-auto"
      />
    </div>

    <div
      ref="contentRef"
      class="relative z-1 overflow-hidden wrapper pt-[calc(var(--app-outer-gutter)*2)] pb-[calc(var(--app-outer-gutter)*1)]"
    >
      <div ref="contentInnerRef">
        <slot />
      </div>
    </div>

    <div
      ref="bottomSectionRef"
      class="min-h-[100svh]"
    />
  </div>
</template>

<style lang="postcss" scoped>
.page-header__grid {
  display: grid;
  grid-template-areas: "stack";
}

.page-header__grid-item {
  grid-area: stack;
}

.page-header__logo {
  max-height: calc(100svh - (var(--app-outer-gutter) * 4));
}
</style>
