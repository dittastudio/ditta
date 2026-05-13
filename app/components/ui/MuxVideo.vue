<script lang="ts" setup>
import { useIntersectionObserver } from '@vueuse/core'
import '@mux/mux-player'

interface Events {
  (event: 'play'): void
  (event: 'ready'): void
}

const emit = defineEmits<Events>()

interface Props {
  playbackId: string
  primaryColor?: string
  accentColor?: string
  isCover?: boolean
  disableTracking?: boolean
  lazyLoad?: boolean
}

const {
  playbackId,
  primaryColor = '#fff',
  accentColor = '#ffa4d2',
  isCover = false,
  disableTracking = true,
  lazyLoad = true,
} = defineProps<Props>()

const hasPlayed = ref(false)
const attrs = useAttrs()
const hasControls = computed(() => Object.hasOwn(attrs, 'controls'))
const showPlay = computed(() => !hasPlayed.value && hasControls.value)
const root = useTemplateRef('root')
const video = ref<HTMLVideoElement | null | undefined>(null)
const isInView = ref(!lazyLoad)

const { stop } = useIntersectionObserver(
  root,
  ([entry]) => {
    if (entry?.isIntersecting) {
      isInView.value = true
      stop()
    }
  },
  { rootMargin: '300px' },
)

const setPlayed = () => {
  hasPlayed.value = true
  emit('play')
}

const setLoadedData = () => {
  emit('ready')
}

const setupVideo = async () => {
  await nextTick()

  video.value = root.value?.querySelector('mux-player')

  video.value?.addEventListener('play', setPlayed)
  video.value?.addEventListener('loadeddata', setLoadedData)
  video.value?.addEventListener('canplay', setLoadedData)

  if (video.value && video.value.readyState >= 2) {
    setLoadedData()
  }
}

watch(isInView, (value) => {
  if (value) {
    setupVideo()
  }
})

onMounted(() => {
  if (isInView.value) {
    setupVideo()
  }
})

onUnmounted(() => {
  video.value?.removeEventListener('play', setPlayed)
  video.value?.removeEventListener('loadeddata', setLoadedData)
  video.value?.removeEventListener('canplay', setLoadedData)
})

const playVideo = async () => {
  video.value?.play()
}
</script>

<template>
  <div
    v-if="playbackId"
    ref="root"
    :class="[
      'size-full relative isolate',
      {
        'aspect-video': !isCover || !isInView,
      },
    ]"
  >
    <button
      v-if="showPlay"
      type="button"
      class="mux-video__button absolute inset-0 z-1 flex items-center justify-center type-h4 text-white bg-transparent"
      @click="playVideo()"
    >
      <div class="mux-video__button-inner">Play</div>
    </button>

    <mux-player
      v-if="isInView"
      v-bind="attrs"
      :id="playbackId"
      :playback-id="playbackId"
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :disable-tracking="disableTracking"
      preload="metadata"
      :class="[
        'block',
        {
          'aspect-video': !isCover,
          'size-full': isCover,
        },
      ]"
      :style="{
        '--controls': Object.hasOwn($attrs, 'controls') ? null : 'none',
        '--media-object-fit': isCover ? 'cover' : null,
        '--media-object-position': isCover ? 'center' : null,
        '--seek-backward-button': 'none',
        '--seek-forward-button': 'none',
        '--playback-rate-button': 'none',
        '--rendition-menu-button': 'none',
        '--center-controls': 'none',
        '--volume-range': 'none',
      }"
    />
  </div>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.mux-video__button {
  opacity: 0.8;
  transition: opacity 0.5s var(--ease-out);

  &::before {
    --tint: var(--color-black);

    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: radial-gradient(
      ellipse at 50% 50%,
      --alpha(var(--tint) / 33%) 0%,
      --alpha(var(--tint) / 0%) 100%
    );
  }

  &:hover {
    opacity: 1;
  }
}

.mux-video__button-inner {
  transition: translate 0.5s var(--ease-out);
  translate: 0 0 0;
  backface-visibility: hidden;

  .mux-video__button:hover & {
    translate: calc(var(--x) * 1px) calc(var(--y) * 1px) 0;
    transition: translate 0.2s var(--ease-out);
  }
}

mux-player::part(bottom play button),
mux-player::part(bottom time display) {
  display: inline-flex;
}
</style>
