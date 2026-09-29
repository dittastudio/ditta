import { useWindowSize } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'
import type { Themes } from '@/types/app'

// One observer shared by every themed section, watching a 1px band just below the middle of the dock.
const sections = new Map<Element, Themes>()
let observer: IntersectionObserver | null = null
let isStarted = false

const startObserver = () => {
  if (isStarted) return
  isStarted = true

  // Detached so the shared observer outlives whichever section happened to start it.
  effectScope(true).run(() => {
    const appStore = useAppStore()
    const { height: windowHeight } = useWindowSize()

    // The dock may mount after the sections during hydration, and the viewport can resize, so rebuild on either.
    watch(
      [() => appStore.getDockHeight, windowHeight],
      ([dockHeight, viewport]) => {
        observer?.disconnect()
        observer = null

        if (!dockHeight) return

        const offset = Math.round(dockHeight / 2) + 30
        const rootMargin = `-${offset}px 0px -${viewport - offset - 1}px 0px`

        observer = new IntersectionObserver(
          (entries) => {
            const entry = entries.findLast((item) => item.isIntersecting)
            const theme = entry && sections.get(entry.target)

            if (theme) appStore.setTheme(theme)
          },
          { rootMargin, threshold: 0 },
        )

        sections.forEach((_, section) => observer?.observe(section))
      },
      { immediate: true },
    )
  })
}

export default function useThemeObserver(
  el: MaybeRefOrGetter<HTMLElement | null | undefined>,
  theme: MaybeRefOrGetter<Themes | undefined>,
) {
  if (import.meta.server) return

  startObserver()

  watch(
    [() => toValue(el), () => toValue(theme)],
    ([target, value], _, onCleanup) => {
      if (!target || !value) return

      sections.set(target, value)
      observer?.observe(target)

      onCleanup(() => {
        sections.delete(target)
        observer?.unobserve(target)
      })
    },
    { immediate: true },
  )
}
