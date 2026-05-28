<script lang="ts" setup>
const { isAudioOn, toggle } = useAudio()

const appStore = useAppStore()
const { theme, navigation } = storeToRefs(appStore)
const isDark = computed(() => theme.value === 'dark')
</script>

<template>
  <button
    class="audio-toggle group flex items-center justify-center"
    :class="isAudioOn ? 'is-active' : ''"
    type="button"
    :aria-label="isAudioOn ? 'Mute audio' : 'Enable audio'"
    :aria-pressed="isAudioOn"
    @click="toggle"
  >
    <span
      class="flex items-center justify-center w-12 h-full rounded-[16px] corner-shape-squircle transition-[background-color] duration-300 ease-out"
      :class="{
        'group-hover:bg-current/15': isDark || navigation,
        'group-hover:bg-current/5': !isDark,
      }"
    >
      <svg
        class="audio-toggle__icon w-4.5 h-auto"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.375 4.21875C10.6752 3.97861 11.0871 3.93211 11.4336 4.09863C11.7799 4.26521 12 4.61571 12 5V19C12 19.3843 11.7799 19.7348 11.4336 19.9014C11.0871 20.0679 10.6752 20.0214 10.375 19.7813L5.64844 16H2C1.44772 16 1 15.5523 1 15V9C1 8.44772 1.44772 8 2 8H5.64844L10.375 4.21875ZM6.625 9.78125C6.44769 9.9231 6.22707 10 6 10H3V14H6C6.22707 14 6.44769 14.0769 6.625 14.2188L10 16.918V7.08106L6.625 9.78125Z"
        />

        <g class="audio-toggle__waves">
          <path
            d="M16.0038 11.9952C16.0038 10.9346 15.5827 9.91715 14.8329 9.16705C14.4425 8.7765 14.4424 8.14346 14.8329 7.75298C15.2235 7.36255 15.8565 7.36251 16.247 7.75298C17.3718 8.87815 18.0038 10.4042 18.0038 11.9952C18.0038 13.5861 17.3718 15.1122 16.247 16.2374C15.8565 16.6277 15.2234 16.6277 14.8329 16.2374C14.4423 15.8469 14.4425 15.2139 14.8329 14.8233C15.5828 14.0732 16.0038 13.0558 16.0038 11.9952Z"
          />
          <path
            d="M20.998 12.0003C20.998 9.61387 20.0504 7.32476 18.3632 5.63702C17.9728 5.24647 17.9727 4.61343 18.3632 4.22295C18.7538 3.83252 19.3868 3.83248 19.7773 4.22295C21.8395 6.28576 22.998 9.08349 22.998 12.0003C22.9979 14.917 21.8393 17.7139 19.7773 19.7767C19.3869 20.1672 18.7538 20.1679 18.3632 19.7776C17.9726 19.3872 17.9727 18.7532 18.3632 18.3626C20.0502 16.675 20.9979 14.3865 20.998 12.0003Z"
          />
        </g>

        <path
          class="audio-toggle__cross"
          d="M21.2929 8.29295C21.6834 7.90243 22.3164 7.90243 22.707 8.29295C23.0975 8.68348 23.0975 9.31649 22.707 9.70702L20.414 12L22.707 14.293C23.0975 14.6835 23.0975 15.3165 22.707 15.707C22.3164 16.0975 21.6834 16.0975 21.2929 15.707L18.9999 13.414L16.707 15.707C16.3164 16.0975 15.6834 16.0975 15.2929 15.707C14.9024 15.3165 14.9024 14.6835 15.2929 14.293L17.5859 12L15.2929 9.70702C14.9024 9.31649 14.9024 8.68348 15.2929 8.29295C15.6834 7.90243 16.3164 7.90243 16.707 8.29295L18.9999 10.5859L21.2929 8.29295Z"
        />
      </svg>
    </span>
  </button>
</template>

<style scoped>
@reference "@/assets/css/app.css";

.audio-toggle__icon {
  .audio-toggle:not(.is-active):hover & {
    animation: wig 0.5s var(--ease-inOutCubic);
  }
}

.audio-toggle__waves {
  opacity: 0;
  transition: opacity 0.15s var(--ease-out);

  .audio-toggle.is-active & {
    opacity: 1;
    transition-duration: 0s;
  }

  .audio-toggle & path {
    transform-origin: center;
  }

  .audio-toggle.is-active & path:nth-child(1),
  .audio-toggle.is-active & path:nth-child(2) {
    animation: scale-out 0.3s var(--ease-outBack) both;
  }

  .audio-toggle.is-active & path:nth-child(2) {
    animation-delay: 0.05s;
  }
}

.audio-toggle__cross {
  opacity: 1;
  transition: opacity 0.15s var(--ease-out) 0.15s;

  .audio-toggle.is-active & {
    opacity: 0;
    transition-duration: 0s;
    transition-delay: 0s;
  }
}

@keyframes wig {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25%,
  75% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

@keyframes scale-out {
  from {
    opacity: 0;
    scale: 0.5;
    transform-origin: center;
  }
  to {
    scale: 1;
    opacity: 1;
    transform-origin: center;
  }
}
</style>
