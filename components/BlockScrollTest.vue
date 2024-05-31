<template>
  <div class="contain-paint">
    <div class="section px-32">
      <div class="container flex gap-32">
        <ul v-for="i in 2" class="shrink-0 w-full grid grid-cols-3 gap-32">
          <li v-for="i in 3" class="col-span-1">
            <div class="aspect-square w-full">
              <img class="w-full h-full object-cover" src="https://placehold.co/600x400" alt="">
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
@keyframes reveal {
  from {
    translate: 0% 0 0;
  }

  to {
    translate: -100% 0 0;
  }
}

.container {
  animation: auto linear reveal both;
  animation-timeline: view();

  animation-range: entry 0% cover 100%;
}
</style>
