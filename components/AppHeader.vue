<template>
  <header class="sticky top-0 h-0 z-10 wrapper">
    <div class="flex justify-end items-end py-[var(--app-outer-gutter)]">
      <a
        class="app-header__link group relative block p-[20px] -m-[20px]"
        href="mailto:hello@ditta.studio"
      >
        <div class="absolute inset-0 -z-1 bg-white rounded-full opacity-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300 ease-smooth" />

        <img
          class="app-header__image size-[40px]"
          src="/imgs/mano.png"
          alt="Mano"
        >
      </a>
    </div>
  </header>
</template>

<style lang="postcss" scoped>
.app-header__image {
  transform-origin: bottom left;
  display: block;

  .app-header__link:hover & {
    animation: hover 0.75s theme('transitionTimingFunction.out') forwards;
  }
}

@keyframes hover {
  0% {
    translate: 0 0 0;
    rotate: 0deg;
  }

  15% {
    translate: -4px 0 0;
    rotate: -10deg;
  }

  30% {
    translate: 4px 0 0;
    rotate: 10deg;
  }

  45% {
    translate: 0 0 0;
    rotate: -8deg;
  }

  60% {
    rotate: 6deg;
  }

  75% {
    rotate: -4deg;
  }

  90% {
    rotate: 0deg;
  }

  100% {
    rotate: 0deg;
  }
}
</style>
