import { defineStore } from 'pinia'
import type { Themes } from '@/types/app'

export type Accent = Extract<Themes, 'pink' | 'mood' | 'olive'>
export type Theme = Themes

const ACCENTS: Accent[] = ['pink', 'mood', 'olive']

export const useAppStore = defineStore(
  'app',
  () => {
    const accent = ref<Accent>('pink')
    const getAccent = computed(() => accent.value)

    function setAccent(value: Accent) {
      accent.value = value
    }

    function cycleAccent() {
      accent.value = ACCENTS[(ACCENTS.indexOf(accent.value) + 1) % ACCENTS.length] ?? 'pink'
    }

    const theme = ref<Theme>('accent')
    const getTheme = computed(() => theme.value)

    function setTheme(value: Theme) {
      theme.value = value
    }

    const navigation = ref(false)
    const getNavigation = computed(() => navigation.value)

    function setNavigation(value: boolean) {
      navigation.value = value
    }

    const dockHeight = ref(0)
    const getDockHeight = computed(() => dockHeight.value)

    function setDockHeight(value: number) {
      dockHeight.value = value
    }

    // Where the floating dock ends, measured from the top of the viewport: its inset plus its height
    const dockBottom = ref(0)
    const getDockBottom = computed(() => dockBottom.value)

    function setDockBottom(value: number) {
      dockBottom.value = value
    }

    return {
      accent,
      getAccent,
      setAccent,
      cycleAccent,
      theme,
      getTheme,
      setTheme,
      navigation,
      getNavigation,
      setNavigation,
      dockHeight,
      getDockHeight,
      setDockHeight,
      dockBottom,
      getDockBottom,
      setDockBottom,
    }
  },
  {
    persist: {
      pick: ['accent'],
      storage: piniaPluginPersistedstate.cookies(),
    },
  },
)
