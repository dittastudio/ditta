// VueLenis with `root` skips its provide() calls and uses module-level globals
// instead, so any descendant calling useLenis() triggers Vue "injection not
// found" warnings. Registering lenis-vue's app plugin sets undefined defaults
// for those inject keys — useLenis still falls through to the globals, but
// the warnings go away.
import vueLenisPlugin from 'lenis/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(vueLenisPlugin)
})
