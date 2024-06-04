<script lang="ts" setup>
export interface Props {
  slideTotal?: number
}

const { slideTotal = 8 } = defineProps<Props>()
</script>

<template>
  <div class="container">
    <div class="container__panel sticky top-0 contain-paint h-screen">
      <div class="scroll h-full flex flex-col justify-center">
        <ul
          class="scroll__list"
        >
          <li
            v-for="i in slideTotal"
            :key="i"
            class="scroll__item"
          >
            <div class="rounded-md overflow-hidden">
              <img
                class="w-full h-full object-cover"
                src="https://placehold.co/600x400"
                alt=""
              >
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.container {
  --slide-total: v-bind(slideTotal);
  --slide-per-view: 1;
  --wrapper-outer-gutter: var(--app-outer-gutter);
  --wrapper-inner-gutter: var(--app-inner-gutter);
  --scrub-vh-sections: 4;
  --scrub-vh-sticky: 1;
  --scrub-vh-total: calc(var(--scrub-vh-sticky) + var(--scrub-vh-sections));

  height: calc(var(--scrub-vh-sections) * 100vh);

  @media (width >= 768px) {
    --slide-per-view: 2;
  }
}

.container__panel {
  padding-inline: calc(var(--wrapper-outer-gutter) - (var(--wrapper-inner-gutter) / 2));
}

.scroll {
  animation: auto linear scroller both;
  animation-timeline: view();

  animation-range: entry 100% cover calc(100% / var(--scrub-vh-total) * var(--scrub-vh-sections));
}

.scroll__list {
  display: flex;
}

.scroll__item {
  flex-shrink: 0;
  width: calc(100% / var(--slide-per-view));
  padding-inline: calc(var(--wrapper-inner-gutter) / 2);
}

@keyframes scroller {
  from {
    translate: 0% 0 0;
  }

  to {
    translate: calc(((var(--slide-total) - var(--slide-per-view)) / var(--slide-per-view)) * -100%) 0 0;
  }
}
</style>
