<script lang="ts" setup>
interface Props {
  isOpen?: boolean
  isDisabled?: boolean
  transitionClasses?: string
}

const { isOpen = false, isDisabled = false, transitionClasses } = defineProps<Props>()

const inner = useTemplateRef('inner')
const wrapper = useTemplateRef('wrapper')
const height = ref('0px')
const canTransition = ref(false)
const isTransitioning = ref(false)

function measure() {
  if (!inner.value) return
  height.value = `${inner.value.scrollHeight}px`
}

watch(
  () => isOpen,
  (open) => {
    isTransitioning.value = true
    if (open) {
      measure()
    } else {
      height.value = '0px'
    }
  },
)

function onTransitionEnd(event: TransitionEvent) {
  if (event.target === wrapper.value && event.propertyName === 'height') {
    isTransitioning.value = false
  }
}

let observer: ResizeObserver | null = null

onMounted(() => {
  if (inner.value) {
    // Force a layout pass on mount so the first open doesn't pay first-paint cost
    void inner.value.scrollHeight

    if (isOpen) {
      height.value = `${inner.value.scrollHeight}px`
    }
  }

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
    ref="wrapper"
    :class="[
      transitionStyle,
      {
        'overflow-hidden': !isDisabled,
        'will-change-[height]': isTransitioning,
      },
    ]"
    :style="wrapperStyle"
    @transitionend="onTransitionEnd"
  >
    <div ref="inner">
      <slot />
    </div>
  </div>
</template>
