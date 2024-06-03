<template>
  <div class="container">
    <div class="sticky top-0 contain-paint h-screen ">
      <div class="scroll h-full flex flex-col justify-center items-center section px-32">
        <div class=" flex gap-32">
          <ul
            v-for="i in 2"
            :key="i"
            class="shrink-0 w-full grid grid-cols-3 gap-32"
          >
            <li
              v-for="j in 3"
              :key="j"
              class="col-span-1"
            >
              <div class="aspect-square w-full">
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
  </div>
</template>

<style lang="postcss" scoped>
.container {
  --scrub-vh-sections: 3;
  --scrub-vh-sticky: 1;
  --scrub-vh-total: calc(var(--scrub-vh-sticky) + var(--scrub-vh-sections));

  height: calc(var(--scrub-vh-sections) * 100vh);
}

.scroll {
  animation: auto linear scroller both;
  animation-timeline: view();

  animation-range: entry 100% cover calc((100% / var(--scrub-vh-total)) * var(--scrub-vh-sections));
}

@keyframes scroller {
  from {
    translate: 0% 0 0;
  }

  to {
    translate: -100% 0 0;
  }
}
</style>
