<script lang="ts" setup>
interface Props {
  errors?: string[]
}

const { errors = [] } = defineProps<Props>()
</script>

<template>
  <!-- Opens its own space rather than appearing in one go, so a blocked Next doesn't bump what's under it. The gap
       above it is the parent's (--brief-error-gap), taken back with a negative margin and given again as padding
       inside the part that grows, so the gap opens along with the message. A new message in place of another just
       swaps: same line, same place. Not clipped while it opens, which would wipe it in. See brief-open in
       transitions.css. -->
  <Transition name="brief-open">
    <div
      v-if="errors.length"
      class="-mt-(--brief-error-gap) grid"
    >
      <div class="min-h-0">
        <p class="pt-(--brief-error-gap) text-16 text-coral">
          {{ errors[0] }}
        </p>
      </div>
    </div>
  </Transition>
</template>
