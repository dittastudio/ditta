import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Nuxt only switches to manual scroll restoration on the second client navigation, so the
// first browser back restores scroll natively before the page transition runs. Take control
// once hydrated, and hand back to the browser on unload so a reload still restores natively.
// ScrollTrigger caches scrollRestoration and rewrites it on every refresh(), so set it through
// ScrollTrigger rather than history directly, otherwise it resets to 'auto'.
gsap.registerPlugin(ScrollTrigger)

export default defineNuxtPlugin((nuxtApp) => {
  if (!('scrollRestoration' in history)) return

  nuxtApp.hook('app:mounted', () => {
    ScrollTrigger.clearScrollMemory('manual')
  })

  window.addEventListener('pagehide', () => {
    history.scrollRestoration = 'auto'
  })
})
