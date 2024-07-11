<script lang="ts" setup>
import type { ServiceStoryblok } from '@/types/storyblok'
import IconServiceDevelopment from '@/assets/icons/service-development.svg'
import IconServiceEcommerce from '@/assets/icons/service-ecommerce.svg'
import IconServiceCms from '@/assets/icons/service-cms.svg'

interface Props {
  service: ServiceStoryblok['service']
}

const { service } = defineProps<Props>()

const icons = {
  development: {
    bg: 'bg-pink',
    icon: IconServiceDevelopment,
  },
  ecommerce: {
    bg: 'bg-yellow',
    icon: IconServiceEcommerce,
  },
  cms: {
    bg: 'bg-green',
    icon: IconServiceCms,
  },
}
</script>

<template>
  <div
    v-if="icons[service]"
    class="flex items-center justify-center rounded-[20px] aspect-1/1 w-96 text-65 font-bold"
    :class="icons[service].bg"
  >
    <Component
      :is="icons[service].icon"
      class="fill-none w-50 h-50"
    />
  </div>
</template>
