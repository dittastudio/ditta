<template>
  <div class="shader aspect-[3/2] bg-offblack">
    <img
      class="w-full h-full object-cover"
      src="/imgs/luca-test.jpg"
    >

    <div class="specular">
      <div class="mask" />
    </div>
  </div>
</template>

<style lang="postcss">
  .shader {
    position: relative;
    overflow: hidden;
    max-width: 800px;
    backface-visibility: hidden; /* to force GPU performance */
  }

  .specular {
    position: absolute;
    z-index: 0;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    backface-visibility: hidden;
    background-color: #000;
    background-image: linear-gradient(125deg, #f09 30%, #fc8b00, #ff0, #00ff8a, #00cfff, #cc4cfa 70%);
    background-attachment: fixed;
    background-position: top center;
    mix-blend-mode: color-dodge;
  }

  .mask {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    backface-visibility: hidden;
    background-color: #000;

    /* background-image: url('/imgs/ditta-holo.svg'); */
    background-image: url('/imgs/ditta-holo.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 45%;
    mix-blend-mode: multiply;

    /* &::after {
      content: '';

      position: absolute;
      z-index: 1;
      top: 0;
      left: 0;

      width: 100%;
      height: 100%;

      backface-visibility: hidden;
      background-color: #000;
      background-image: linear-gradient(45deg, #333 40%, #ddd 60%, #333);
      background-attachment: fixed;
      background-position: center;
      mix-blend-mode: color-burn;
    } */
  }
</style>
