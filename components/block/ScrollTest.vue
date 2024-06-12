<script lang="ts" setup>
export interface Props {
  slideTotal?: number
}

const { slideTotal = 8 } = defineProps<Props>()
</script>

<template>
  <div class="block-scroll-test">
    <div class="sticky top-0 h-screen block-scroll-test__panel contain-paint">
      <div class="flex flex-col justify-center h-full block-scroll-test__scroll">
        <ul
          class="block-scroll-test__list"
        >
          <li
            v-for="i in slideTotal"
            :key="i"
            class="block-scroll-test__item shrink-0"
          >
            <div class="overflow-hidden rounded-md">
              <img
                class="object-cover w-full h-full"
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
.block-scroll-test {
  --slide-total: v-bind(slideTotal);
  --slide-per-view: 1;
  --wrapper-outer-gutter: var(--app-outer-gutter);
  --wrapper-inner-gutter: var(--app-inner-gutter);
  --scrub-vh-sections: 4;
  --scrub-vh-sticky: 1;
  --scrub-vh-total: calc(var(--scrub-vh-sticky) + var(--scrub-vh-sections));

  height: calc(var(--scrub-vh-sections) * 100vh);

  @screen md {
    --slide-per-view: 2;
  }
}

.block-scroll-test__panel {
  padding-inline: calc(var(--wrapper-outer-gutter) - (var(--wrapper-inner-gutter) / 2));
}

.block-scroll-test__scroll {
  animation: auto linear scroller both;
  animation-timeline: view();

  animation-range: entry 100% cover calc(100% / var(--scrub-vh-total) * var(--scrub-vh-sections));
}

.block-scroll-test__list {
  display: flex;
}

.block-scroll-test__item {
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
