<script lang="ts" setup>
interface Props {
  inRage?: boolean
  screenSrc?: string
}

const { inRage, screenSrc = '/imgs/blue-screen.svg' } = defineProps<Props>()
</script>

<template>
  <svg
    viewBox="0 0 291 298"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M86 48h120v9H86v-9z"
      fill="#000"
    />
    <path
      d="M86 48h9v83h-9V48z"
      fill="#000"
    />
    <path
      d="M206 37h11v103h-11V37z"
      fill="#999"
    />
    <path
      d="M217 37h9v113h-9V37z"
      fill="#fff"
    />
    <path
      d="M86 140h140v10H86v-10z"
      fill="#fff"
    />
    <path
      d="M86 37h131v11H86V37z"
      fill="#999"
    />
    <path
      d="M75 28h160v9H75v-9zM254 242H49v-46h205v46z"
      fill="#CCC"
    />
    <path
      d="M226 28h9v131h-9V28z"
      fill="#CCC"
    />
    <path
      d="M75 150h160v9H75v-9z"
      fill="#CCC"
    />
    <path
      d="M75 28h11v131H75V28z"
      fill="#CCC"
    />
    <path
      d="M66 28h9v131h-9V28zM75 28h160v-9H75v9z"
      fill="#fff"
    />
    <path
      d="M86 19h149V9H86v10z"
      fill="#CCC"
    />
    <path
      d="M243 19h-8V9h8v10z"
      fill="#fff"
    />
    <path
      d="M86 9h168V0H86v9zM75 19h11V9H75v10zM66 28h9v-9h-9v9zM58 168h8V28h-8v140z"
      fill="#999"
    />
    <path
      d="M58 168h185v-9H58v9zM235 159h8V19h-8v140zM243 159h11V0h-11v159z"
      fill="#999"
    />
    <path
      d="M254 159h9V9h-9v150zM254 159h-11v9h11v-9zM243 168H58v9h185v-9z"
      fill="#000"
    />
    <path
      d="M254 177H38v10h216v-10zM29 253h9v-66h-9v66z"
      fill="#999"
    />
    <path
      d="M49 242H38v-55h11v55zM254 196H49v-9h205v9z"
      fill="#fff"
    />
    <path
      d="M235 216h-94v-11h94v11z"
      fill="#999"
    />
    <path
      d="M235 225h-94v-9h94v9z"
      fill="#000"
    />
    <path
      d="M29 253h29v-11H29v11z"
      fill="#999"
    />
    <path
      d="M66 253h-8v-11h8v11z"
      fill="#000"
    />
    <path
      d="M66 253h9v-11h-9v11z"
      fill="#fff"
    />
    <path
      d="M86 253H75v-11h11v11z"
      fill="#999"
    />
    <path
      d="M86 253h9v-11h-9v11z"
      fill="#000"
    />
    <path
      d="M104 253h-9v-11h9v11z"
      fill="#fff"
    />
    <path
      d="M104 253h8v-11h-8v11z"
      fill="#999"
    />
    <path
      d="M122 253h-10v-11h10v11z"
      fill="#000"
    />
    <path
      d="M122 253h10v-11h-10v11zM151 253h9v-11h-9v11z"
      fill="#fff"
    />
    <path
      d="M141 253h-9v-11h9v11zM169 253h-9v-11h9v11z"
      fill="#999"
    />
    <path
      d="M178 253h-9v-11h9v11z"
      fill="#000"
    />
    <path
      d="M178 253h10v-11h-10v11z"
      fill="#fff"
    />
    <path
      d="M206 253h-9v-11h9v11z"
      fill="#000"
    />
    <path
      d="M206 253h11v-11h-11v11z"
      fill="#fff"
    />
    <path
      d="M235 253h-9v-11h9v11z"
      fill="#000"
    />
    <path
      d="M235 253h8v-11h-8v11z"
      fill="#fff"
    />
    <path
      d="M226 262h-9v-9h9v9z"
      fill="#000"
    />
    <path
      d="M226 262h9v-9h-9v9z"
      fill="#fff"
    />
    <path
      d="M197 262h-9v-9h9v9z"
      fill="#000"
    />
    <path
      d="M197 262h9v-9h-9v9z"
      fill="#fff"
    />
    <path
      d="M169 262h-9v-9h9v9z"
      fill="#000"
    />
    <path
      d="M169 262h9v-9h-9v9z"
      fill="#fff"
    />
    <path
      d="M141 262h-9v-9h9v9z"
      fill="#000"
    />
    <path
      d="M141 262h10v-9h-10v9z"
      fill="#fff"
    />
    <path
      d="M112 262h-8v-9h8v9z"
      fill="#000"
    />
    <path
      d="M112 262h10v-9h-10v9z"
      fill="#fff"
    />
    <path
      d="M86 262H75v-9h11v9z"
      fill="#000"
    />
    <path
      d="M86 262h9v-9h-9v9z"
      fill="#fff"
    />
    <path
      d="M58 262h-9v-9h9v9z"
      fill="#000"
    />
    <path
      d="M58 262h8v-9h-8v9z"
      fill="#fff"
    />
    <path
      d="M38 262h11v-9H38v9zM66 262h9v-9h-9v9zM95 262h9v-9h-9v9zM122 262h10v-9h-10v9zM151 262h9v-9h-9v9zM178 262h10v-9h-10v9zM206 262h11v-9h-11v9zM217 253h9v-11h-9v11zM188 253h9v-11h-9v11z"
      fill="#999"
    />
    <path
      d="M49 270H38v-8h11v8z"
      fill="#000"
    />
    <path
      d="M29 270h9v-8h-9v8z"
      fill="#999"
    />
    <path
      d="M75 270h-9v-8h9v8zM104 270h-9v-8h9v8zM132 270h-10v-8h10v8zM160 270h-9v-8h9v8zM188 270h-10v-8h10v8zM217 270h-11v-8h11v8z"
      fill="#000"
    />
    <path
      d="M254 270h-37v-8h37v8zM243 270h-8v9h8v-9z"
      fill="#999"
    />
    <path
      d="M235 270h-9v9h9v-9z"
      fill="#CCC"
    />
    <path
      d="M254 262h-19v-9h19v9zM206 270h-18v-8h18v8zM178 270h-18v-8h18v8zM151 270h-19v-8h19v8zM122 270h-18v-8h18v8zM95 270H75v-8h20v8zM66 270H49v-8h17v8z"
      fill="#999"
    />
    <path
      d="M254 253h-11v-11h11v11zM141 253h10v-11h-10v11z"
      fill="#000"
    />
    <path
      d="M29 253h-9v9h9v-9z"
      fill="#999"
    />
    <path
      d="M29 253h9v9h-9v-9z"
      fill="#fff"
    />
    <path
      d="M10 270h10v-8H10v8z"
      fill="#999"
    />
    <path
      d="M29 270h-9v-8h9v8z"
      fill="#fff"
    />
    <path
      d="M10 270H0v28h10v-28zM263 168h-20v9h20v-9zM273 159h-20v9h20v-9zM283 150h-20v9h20v-9z"
      fill="#999"
    />
    <path
      d="M263 177h-9v10h9v-10z"
      fill="#CCC"
    />
    <path
      d="M263 253h-9v-66h9v66z"
      fill="#999"
    />
    <path
      d="M263 253h-9v17h9v-17zM254 270h-11v9h11v-9zM243 279h-8v11h8v-11zM235 290H10v8h225v-8z"
      fill="#000"
    />
    <path
      d="M226 279H10v11h216v-11z"
      fill="#CCC"
    />
    <path
      d="M226 279H10v-9h216v9z"
      fill="#fff"
    />
    <path
      d="M226 279h9v11h-9v-11zM0 270h10v28H0v-28zM273 253h-10v-76h10v76z"
      fill="#999"
    />
    <path
      d="M273 253h-10v9h10v-9z"
      fill="#000"
    />
    <path
      d="M283 242h-10v-74h10v74z"
      fill="#999"
    />
    <path
      d="M283 242h-10v11h10v-11zM291 242h-8v-83h8v83z"
      fill="#000"
    />
    <path
      d="M273 168h-10v9h10v-9zM283 159h-10v9h10v-9z"
      fill="#CCC"
    />

    <path
      d="M86 225H66v-9h20v9z"
      :fill="inRage ? '#FF9800' : '#0F0'"
    />
    <path
      d="M86 233H66v-8h20v8z"
      :fill="inRage ? '#B05800' : '#009A01'"
    />

    <template v-if="inRage">
      <image
        :href="screenSrc"
        x="95"
        y="57"
        width="111"
        height="74"
      />
    </template>

    <template v-else>
      <path
        d="M95 57h111v74H95V57z"
        fill="currentColor"
      />
      <path
        d="M180.249 131.336c-4.41 0-7.686-2.226-7.686-6.174 0-4.452 3.864-6.636 8.484-7.098l4.536-.462c1.176-.126 1.806-.882 1.806-1.89 0-1.176-1.218-2.184-3.318-2.184-2.268 0-3.864 1.134-4.2 3.108h-5.964c.588-4.746 5.418-7.77 10.29-7.77 6.258 0 9.996 3.612 8.988 9.45l-1.092 6.216c-.126.756.084 1.512 1.008 1.512.294 0 .546-.042.756-.084l-.882 5.04c-.546.168-1.302.294-2.352.294-2.226 0-3.906-1.176-4.032-2.688-.882 1.596-3.402 2.73-6.342 2.73zm.756-4.536c2.94 0 4.914-1.932 5.46-4.662l.126-.756-4.83.672c-1.89.252-3.192 1.302-3.192 2.814 0 1.176.882 1.932 2.436 1.932zM166.931 131.336c-4.704 0-8.148-2.604-6.972-9.198l1.386-7.854h-3.528l.882-5.082h3.528l1.134-6.342h6.216l-1.134 6.342h4.83l-.882 5.082h-4.83l-1.512 8.568c-.336 1.932.63 3.108 2.352 3.108.924 0 1.47-.126 1.932-.294l-.924 5.376c-.462.126-1.302.294-2.478.294zM151.345 131.336c-4.704 0-8.148-2.604-6.972-9.198l1.386-7.854h-3.528l.882-5.082h3.528l1.134-6.342h6.216l-1.134 6.342h4.83l-.882 5.082h-4.83l-1.512 8.568c-.336 1.932.63 3.108 2.352 3.108.924 0 1.47-.126 1.932-.294l-.924 5.376c-.462.126-1.302.294-2.478.294zM130.802 131l3.864-21.798h6.258L137.06 131h-6.258zm4.284-24.528l1.05-6.006h6.552l-1.092 6.006h-6.51zM114.786 131.336c-4.956 0-8.736-4.158-8.736-9.996 0-6.762 4.368-12.474 11.55-12.474 2.604 0 5.124 1.008 6.342 2.478l1.89-10.962h6.258L126.798 131h-6.258l.462-2.436c-1.092 1.596-3.486 2.772-6.216 2.772zm2.016-5.25c3.864 0 6.006-3.738 6.006-7.14 0-2.982-1.89-4.83-4.662-4.83-3.486 0-5.88 3.024-5.88 6.972 0 2.898 1.89 4.998 4.536 4.998z"
        fill="#000"
      />
    </template>

    <path
      d="M86 131h131v9H86v-9z"
      fill="#999"
    />
  </svg>
</template>
