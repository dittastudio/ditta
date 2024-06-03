<template>
  <div class="container">
    <div class="sticky top-0 contain-paint h-screen">
      <div class="scroll w-max h-full flex flex-col justify-center">
        <div class="wrapper">
          <ul
            class="flex gap-24"
          >
            <li
              v-for="i in 6"
              :key="i"
              class="w-full md:w-1/2"
            >
              <!-- <div class="aspect-square w-full"> -->
              <img
                class="w-full h-full object-cover"
                src="https://placehold.co/600x400"
                alt=""
              >
            <!-- </div> -->
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.container {
  --scrub-vh-sections: 2;
  --scrub-vh-sticky: 1;
  --scrub-vh-total: calc(var(--scrub-vh-sticky) + var(--scrub-vh-sections));

  height: calc(var(--scrub-vh-sections) * 100vh);
}

.scroll {
  animation: auto linear scroller both;
  animation-timeline: view();

  animation-range: entry 100% cover calc(100% / var(--scrub-vh-total) * var(--scrub-vh-sections));
}

@keyframes scroller {
  from {
    translate: 0% 0 0;
  }

  to {
    translate: calc(-100% + 100vw) 0 0;
  }
}
</style>
