<script lang="ts" setup>
interface Props {
  errors?: string[]
}

const { errors = [] } = defineProps<Props>()
</script>

<template>
  <p
    v-if="errors.length"
    class="text-16 text-coral"
  >
    {{ errors[0] }}
  </p>
</template>
