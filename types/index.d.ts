/// <reference types="vite-svg-loader" />

declare module '*.svg' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent
  export default component
}
