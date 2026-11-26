<script lang="ts" setup>
interface Props {
  errors?: string[]
}

const { errors = [] } = defineProps<Props>()
</script>

<template>
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
