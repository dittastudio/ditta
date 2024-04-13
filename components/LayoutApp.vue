<template>
  <div class="layout-app">
    <slot name="header" />

    <main class="layout-app__main">
      <slot name="main" />
    </main>

    <footer class="layout-app__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style lang="postcss" scoped>
.layout-app {
  isolation: isolate;
  display: flex;
  flex-direction: column;
  /* svh doesn't work on Kate's phone, lol. Fallback. */
  min-height: 100vh;
  min-height: 100svh;
}

.layout-app__main {
  display: flex;
  flex-grow: 1;

  &:deep(>*) {
    width: 100%;
  }
}
</style>
