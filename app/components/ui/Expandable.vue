<script lang="ts" setup>
interface Props {
  isOpen?: boolean
  isDisabled?: boolean
  transitionClasses?: string
}

const { isOpen = false, isDisabled = false, transitionClasses } = defineProps<Props>()

const inner = useTemplateRef('inner')
const height = ref('0px')
const canTransition = ref(false)

async function measure() {
  if (!inner.value) return

  await nextTick()

  height.value = `${inner.value.getBoundingClientRect().height}px`
}

watch(
  () => isOpen,
  (open) => {
    if (open) {
      measure()
    } else {
      height.value = '0px'
    }
  },
)

let observer: ResizeObserver | null = null

onMounted(() => {
  if (isOpen) measure()

  nextTick(() => {
    canTransition.value = true
  })

  if (inner.value) {
    observer = new ResizeObserver(() => {
      if (isOpen) measure()
    })
    observer.observe(inner.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

const transitionStyle = computed(() => {
  if (isDisabled || !canTransition.value) return undefined
  return `transition-[height] ${transitionClasses ?? 'duration-300 ease-in-out'}`
})

const wrapperStyle = computed(() => {
  if (isDisabled) return undefined

  return {
    height: height.value,
  }
})
</script>

<template>
  <div
    class="will-change-[height]"
    :class="[transitionStyle, { 'overflow-hidden': !isDisabled }]"
    :style="wrapperStyle"
  >
    <div ref="inner">
      <slot />
    </div>
  </div>
</template>
