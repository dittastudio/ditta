<template>
  <div class="grid-guide">
    <input
      class="peer fixed z-50 size-12 rounded-full bottom-5 right-5 font-[monospace] shadow-lg backdrop-blur-md bg-white/50 hover:bg-white/80 checked:bg-white/20 transition-all duration-200 ease-smooth appearance-none cursor-pointer"
      type="checkbox"
    >

    <div
      class="wrapper ease-smooth fixed inset-0 z-40 w-full h-full transition-opacity duration-200 pointer-events-none opacity-0 peer-checked:opacity-100"
    >
      <div class="grid gap-x-[var(--app-inner-gutter)] grid-cols-2 md:grid-cols-12 h-screen">
        <div
          v-for="i in 12"
          :key="i"
          class="guide-col bg-[blue]/20"
        />
      </div>
    </div>
  </div>
</template>
