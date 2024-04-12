<script lang="ts" setup>
import IconDitta from '@/assets/icons/ditta.svg'

const prevScrollPos = ref<number>(0)
const hasScrolled = ref<boolean>(false)
const hasScrolledUp = ref<boolean>(false)
const hasScrolledDown = ref<boolean>(false)
const raf = ref<any>(null)

const handleScroll = () => {
  const triggerPoint = 50

  const scrollPos = window.scrollY

  hasScrolled.value = scrollPos > triggerPoint

  // Scrolling up
  if (prevScrollPos.value > scrollPos) {
    hasScrolledUp.value = scrollPos > triggerPoint
    hasScrolledDown.value = false

    // Scrolling down
  } else {
    hasScrolledUp.value = false
    hasScrolledDown.value = scrollPos > triggerPoint
  }

  prevScrollPos.value = scrollPos

  raf.value = null
}

const rAFHeaderScroll = () => {
  if (!raf.value) {
    raf.value = requestAnimationFrame(handleScroll)
  }
}

onMounted(() => {
  rAFHeaderScroll()
  window.addEventListener('scroll', rAFHeaderScroll)
})

const headerClasses = computed<any>(() => ({
  'app-header--has-scrolled': hasScrolled.value,
  'app-header--has-scrolled-up': hasScrolledUp.value,
  'app-header--has-scrolled-down': hasScrolledDown.value,
}))
</script>

<template>
  <div class="app-header app-header--logo" :class="headerClasses">
    <div class="app-header__outer">
      <div class="app-header__inner">
        <IconDitta class="app-header__icon" />
      </div>
    </div>
  </div>

  <div class="app-header app-header--nav" :class="headerClasses">
    <div class="app-header__outer">
      <div class="app-header__inner type-h6">
        Contact
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.app-header {
  isolation: isolate;
  position: sticky;
  top: 0;

  &--logo {
    z-index: 2;
    mix-blend-mode: difference;
  }

  &--nav {
    z-index: 1;
  }

  &+& {
    margin-top: calc(-1 * var(--app-header-height));
  }
}

.app-header__outer {
  display: flex;
  height: var(--app-header-height);
  padding: var(--app-header-outer-gutter);

  .app-header--logo & {
    color: theme('colors.offwhite');
  }

  .app-header--nav & {
    color: theme('colors.offwhite');
  }

  .app-header--has-scrolled-up & {
    translate: 0 0 0;
    transition: translate theme('transitionDuration.500') theme('transitionTimingFunction.inOutExpo');
  }

  .app-header--has-scrolled-down & {
    translate: 0 -100% 0;
    transition: translate theme('transitionDuration.200') theme('transitionTimingFunction.inQuart');
  }
}

.app-header__inner {
  display: flex;
  align-items: center;
  width: 100%;
  padding-inline: var(--app-header-inner-gutter);

  .app-header--nav & {
    justify-content: flex-end;
    background-color: theme('colors.offblack/0.5');

    /* backdrop-filter: blur(8px); */
    border: 1px solid theme('colors.offblack');
    border-radius: theme('borderRadius.md');
  }
}

.app-header__icon {
  --icon-size: 56px;

  @screen md {
    --icon-size: 80px;
  }

  width: var(--icon-size);
  height: auto;
}
</style>
