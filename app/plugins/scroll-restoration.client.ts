// Nuxt only switches to manual scroll restoration on the second client navigation, so the
// first browser back restores scroll natively before the page transition runs. Take control
// once hydrated, and hand back to the browser on unload so a reload still restores natively.
// ScrollTrigger caches scrollRestoration and rewrites it on every refresh(), so set it through
// ScrollTrigger rather than history directly, otherwise it resets to 'auto'. Imported only then, to
// keep GSAP out of the entry chunk.
const takeControl = async () => {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])

  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.clearScrollMemory('manual')
}

export default defineNuxtPlugin((nuxtApp) => {
  if (!('scrollRestoration' in history)) return

  nuxtApp.hook('app:mounted', takeControl)

  window.addEventListener('pagehide', () => {
    history.scrollRestoration = 'auto'
  })

  // Restored from the back-forward cache: no reload and no app:mounted, so take control again here
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void takeControl()
  })
})
