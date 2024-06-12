<script setup lang="ts">
const container = ref(null as HTMLElement | null)
const raf = ref(null as number | null)
const mouse = ref({ x: 0, y: 0 })
const cursor = ref({ x: 0, y: 0 })
// const cursorRef = ref(null as HTMLElement | null)
const speed = 0.05

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b

const deltaTime = (
  mouseX: number,
  mouseY: number,
  cursorX: number,
  cursorY: number,
) => Math.sqrt((mouseX - cursorX) ** 2 + (mouseY - cursorY) ** 2)

const setMouseCoordinates = () => {
  // Calculate lerped values (gives cursor inertia)
  cursor.value.x = lerp(cursor.value.x, mouse.value.x, speed)
  cursor.value.y = lerp(cursor.value.y, mouse.value.y, speed)

  container.value?.style.setProperty('--cursor-x', String(cursor.value.x))
  container.value?.style.setProperty('--cursor-y', String(cursor.value.y))

  // Determine isolated inertia to calculate when to cancel the requestAnimationFrame
  const delta = deltaTime(
    mouse.value.x,
    mouse.value.y,
    cursor.value.x,
    cursor.value.y,
  )

  if (delta < 0.001) {
    if (raf.value)
      cancelAnimationFrame(raf.value)
    raf.value = null
    return
  }

  raf.value = requestAnimationFrame(() => setMouseCoordinates())
}

const onMouseMove = (event: any) => {
  // Get normalized mouse coordinates [0, 1]
  mouse.value.x = event.clientX / window.innerWidth
  mouse.value.y = event.clientY / window.innerHeight

  container.value?.style.setProperty('--mouse-y', String(event.pageY))

  if (!raf.value)
    raf.value = requestAnimationFrame(() => setMouseCoordinates())
}

const addCursorListener = () => {
  window.addEventListener('mousemove', event => onMouseMove(event))
  raf.value = requestAnimationFrame(() => setMouseCoordinates())
}

const removeCursorListener = () => {
  window.removeEventListener('mousemove', event => onMouseMove(event))

  if (raf.value)
    cancelAnimationFrame(raf.value)
}

onMounted(() => {
  addCursorListener()
})

onBeforeUnmount(() => {
  removeCursorListener()
})

// const handleMouseMove = (e: MouseEvent) => {
//   const x = Math.round((e.clientX / window.innerWidth) * 100)
//   const y = Math.round((e.clientY / window.innerHeight) * 100)

//   if (cursor.value) {
//     cursor.value.style.setProperty('--xMouse', `${x}`)
//     cursor.value.style.setProperty('--yMouse', `${y}`)
//     container.value.style.setProperty('--x', `${e.clientX}px`)
//     container.value.style.setProperty('--y', `${e.clientY}px`)
//   }
// }

// onMounted(() => {
//   window.addEventListener('mousemove', handleMouseMove)
// })
</script>

<template>
  <div
    ref="container"
    class="test-container"
  >
    <!-- <div
      class="cursor"
    /> -->

    <div class="top-layer">
      <div class="bg-offblack flex flex-col justify-between min-h-screen">
        <BlockHeading
          background-color="offblack"
          text-color="offwhite"
          :copy="['Freedom']"
          duration="60s"
          direction="left"
        />

        <BlockHeading
          background-color="offblack"
          text-color="offwhite"
          :copy="['Transparency']"
          duration="60s"
          direction="right"
        />
      </div>

      <div class="bg-offwhite flex flex-col justify-between min-h-screen">
        <BlockHeading
          background-color="offwhite"
          text-color="offblack"
          :copy="['Obey']"
          duration="60s"
          direction="left"
        />

        <BlockHeading
          background-color="offwhite"
          text-color="offblack"
          :copy="['Consume']"
          duration="60s"
          direction="right"
        />
      </div>

      <div class="bg-offblack flex flex-col justify-between min-h-screen">
        <BlockHeading
          background-color="offblack"
          text-color="pink"
          :copy="['Obey']"
          duration="60s"
          direction="left"
        />

        <BlockHeading
          background-color="offblack"
          text-color="pink"
          :copy="['Consume']"
          duration="60s"
          direction="right"
        />
      </div>

      <div class="bg-pink flex flex-col justify-between min-h-screen">
        <BlockHeading
          background-color="pink"
          text-color="offblack"
          :copy="['Obey']"
          duration="60s"
          direction="left"
        />

        <BlockHeading
          background-color="pink"
          text-color="offblack"
          :copy="['Consume']"
          duration="60s"
          direction="right"
        />
      </div>
    </div>

    <div class="bottom-layer">
      <div class="bg-offwhite flex flex-col justify-between min-h-screen">
        <BlockHeading
          background-color="offwhite"
          text-color="offblack"
          :copy="['Obey']"
          duration="60s"
          direction="left"
        />

        <BlockHeading
          background-color="offwhite"
          text-color="offblack"
          :copy="['Consume']"
          duration="60s"
          direction="right"
        />
      </div>

      <div class="bg-offblack flex flex-col justify-between min-h-screen">
        <BlockHeading
          background-color="offblack"
          text-color="offwhite"
          :copy="['Obey']"
          duration="60s"
          direction="left"
        />

        <BlockHeading
          background-color="offblack"
          text-color="offwhite"
          :copy="['Consume']"
          duration="60s"
          direction="right"
        />
      </div>

      <div class="bg-pink flex flex-col justify-between min-h-screen">
        <BlockHeading
          background-color="pink"
          text-color="offblack"
          :copy="['Obey']"
          duration="60s"
          direction="left"
        />

        <BlockHeading
          background-color="pink"
          text-color="offblack"
          :copy="['Consume']"
          duration="60s"
          direction="right"
        />
      </div>

      <div class="bg-offblack flex flex-col justify-between min-h-screen">
        <BlockHeading
          background-color="offblack"
          text-color="pink"
          :copy="['Obey']"
          duration="60s"
          direction="left"
        />

        <BlockHeading
          background-color="offblack"
          text-color="pink"
          :copy="['Consume']"
          duration="60s"
          direction="right"
        />
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.test-container {
  isolation: isolate;
  position: relative;
  z-index: 1;
}

.cursor {
  --size: 50px;

  pointer-events: none;

  position: fixed;
  z-index: 50;
  top: 0;
  left: 0;
  translate: calc(100vw * var(--cursor-x) - var(--size) / 2) calc(100vh * var(--cursor-y) - var(--size) / 2) 0;

  width: var(--size);
  height: var(--size);

  background-color: #fff;
  border-radius: 50%;
  mix-blend-mode: difference;
}

.top-layer {
  /* opacity: 0; */
}

.bottom-layer {
  --maskSize1: 150px;
  --mask: radial-gradient(
    circle at calc(var(--cursor-x) * 100%) calc(var(--mouse-y) * 1px),
    black var(--maskSize1),
    transparent 0,
    transparent 0
  );

  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;

  width: 100%;

  background-color: red;

  mask-image: var(--mask);

  /* inset: 0; */
}
</style>
