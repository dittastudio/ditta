<script lang="ts" setup>
// The thank-you, once a brief's link has been clicked: at the end of the brief, and on the confirm page
interface Props {
  name?: string | null
}

const { name } = defineProps<Props>()

const firstName = computed(() => briefFirstName({ name: name ?? undefined }))

// The line above the burger, by how many have been eaten. It moves on with each one's last bite and holds while the
// next arrives. The last is game over, after the third (see Burger.vue), and Restart goes back to the first.
const lines = [
  'Have a burger on us!',
  'Struth! Fancy another...?',
  'Ooo, getting full are we?',
  'Absolute filth, game over.',
]
const eaten = ref(0)
const current = computed(() => Math.min(eaten.value, lines.length - 1))
</script>

<template>
  <section class="flex flex-col items-center gap-10 text-center">
    <p class="mb-5 text-24 leading-tight text-balance trim-both md:mb-8 md:text-28">
      <span
        class="inline-grid"
        aria-hidden="true"
      >
        <span
          v-for="(line, index) in lines"
          :key="line"
          class="col-start-1 row-start-1 transition-[opacity,translate,scale,filter]"
          :class="
            index === current
              ? 'delay-100 duration-panel ease-outBack'
              : index < current
                ? 'opacity-0 duration-quick ease-outCubic motion-safe:-translate-y-2 motion-safe:blur-xs'
                : 'opacity-0 duration-quick ease-outCubic motion-safe:translate-y-3 motion-safe:scale-96 motion-safe:blur-xs'
          "
        >
          {{ line }}
        </span>
      </span>
      <span
        class="sr-only"
        role="status"
        >{{ lines[current] }}</span
      >
    </p>

    <BriefBurger v-model:eaten="eaten" />

    <h1
      class="text-24 leading-tight text-balance trim-both md:text-28"
      data-crumb-surface="text"
    >
      Thanks{{ firstName ? `, ${firstName}` : '' }}. We've got your brief.
    </h1>

    <p
      class="max-w-[38ch] text-18 opacity-60 md:text-20"
      data-crumb-surface="text"
    >
      We'll reply within two working days to book a short call. A copy is on its way to your inbox.
    </p>
  </section>
</template>
