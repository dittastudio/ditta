import { defineStore } from 'pinia'
import type { Themes } from '@/types/app'

export type Accent = Extract<Themes, 'pink' | 'mood' | 'olive'>
export type Theme = Themes

export const useAppStore = defineStore(
  'app',
  () => {
    const accent = ref<Accent>('pink')
    const getAccent = computed(() => accent.value)

    function setAccent(value: Accent) {
      accent.value = value
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

    return {
      accent,
      getAccent,
      setAccent,
      theme,
      getTheme,
      setTheme,
      navigation,
      getNavigation,
      setNavigation,
    }
  },
  {
    persist: {
      pick: ['accent'],
      storage: piniaPluginPersistedstate.cookies(),
    },
  },
)
