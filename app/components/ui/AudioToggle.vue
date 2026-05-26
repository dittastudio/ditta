<script lang="ts" setup>
const { isAudioOn, toggle } = useAudio()
</script>

<template>
  <button
    class="group flex items-center justify-center p-1"
    :class="isAudioOn ? 'is-active' : ''"
    type="button"
    :aria-label="isAudioOn ? 'Mute audio' : 'Enable audio'"
    :aria-pressed="isAudioOn"
    @click="toggle"
  >
    <span
      class="block p-3 rounded-[16px] corner-shape-squircle transition-[background-color] duration-300 ease-out group-hover:bg-current/15"
    >
      <svg
        class="w-5 h-auto group-not-[.is-active]:opacity-60 transition-opacity duration-300 ease-out"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.375 4.21875C10.6752 3.97861 11.0871 3.93211 11.4336 4.09863C11.7799 4.26521 12 4.61571 12 5V19C12 19.3843 11.7799 19.7348 11.4336 19.9014C11.0871 20.0679 10.6752 20.0214 10.375 19.7813L5.64844 16H2C1.44772 16 1 15.5523 1 15V9C1 8.44772 1.44772 8 2 8H5.64844L10.375 4.21875ZM6.625 9.78125C6.44769 9.9231 6.22707 10 6 10H3V14H6C6.22707 14 6.44769 14.0769 6.625 14.2188L10 16.918V7.08106L6.625 9.78125Z"
        />

        <Transition
          mode="out-in"
          enter-from-class="opacity-0 scale-90"
          enter-active-class="transition-[opacity,scale] duration-100 ease-out origin-center"
          enter-to-class="opacity-100 scale-100"
          leave-from-class="opacity-100 scale-100"
          leave-active-class="transition-[opacity,scale] duration-100 ease-in origin-center"
          leave-to-class="opacity-0 scale-90"
        >
          <path
            v-if="isAudioOn"
            d="M20.998 12.0003C20.998 9.61397 20.0503 7.32478 18.3632 5.63706C17.9727 5.24647 17.9726 4.61346 18.3632 4.22299C18.7538 3.83256 19.3868 3.83242 19.7773 4.22299C21.8394 6.28579 22.998 9.08355 22.998 12.0003C22.9979 14.9169 21.8392 17.714 19.7773 19.7767C19.3869 20.1672 18.7538 20.1678 18.3632 19.7777C17.9726 19.3872 17.9727 18.7532 18.3632 18.3626C20.0501 16.675 20.9979 14.3865 20.998 12.0003ZM16.0038 11.9955C16.0038 10.9349 15.5827 9.91742 14.8329 9.16733C14.4425 8.77683 14.4426 8.14375 14.8329 7.75327C15.2235 7.3628 15.8565 7.36268 16.247 7.75327C17.3718 8.87843 18.0038 10.4045 18.0038 11.9955C18.0037 13.5862 17.3717 15.1116 16.247 16.2367C15.8566 16.6272 15.2235 16.6279 14.8329 16.2376C14.4423 15.8472 14.4425 15.2132 14.8329 14.8226C15.5825 14.0726 16.0037 13.0558 16.0038 11.9955Z"
          />

          <path
            v-else
            d="M21.2929 8.29295C21.6834 7.90243 22.3164 7.90243 22.707 8.29295C23.0975 8.68348 23.0975 9.31649 22.707 9.70702L20.414 12L22.707 14.293C23.0975 14.6835 23.0975 15.3165 22.707 15.707C22.3164 16.0975 21.6834 16.0975 21.2929 15.707L18.9999 13.414L16.707 15.707C16.3164 16.0975 15.6834 16.0975 15.2929 15.707C14.9024 15.3165 14.9024 14.6835 15.2929 14.293L17.5859 12L15.2929 9.70702C14.9024 9.31649 14.9024 8.68348 15.2929 8.29295C15.6834 7.90243 16.3164 7.90243 16.707 8.29295L18.9999 10.5859L21.2929 8.29295Z"
          />
        </Transition>
      </svg>
    </span>
  </button>
</template>
