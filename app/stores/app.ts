import { defineStore } from 'pinia'
import type { Themes } from '@/types/app'

type SelectableThemes = Extract<Themes, 'pink' | 'olive' | 'mood'>

export const useAppStore = defineStore(
  'app',
  () => {
    const theme = ref<SelectableThemes>('pink')

    const getTheme = computed(() => theme.value)

    function setTheme(value: SelectableThemes) {
      theme.value = value
    }

    return {
      theme,
      getTheme,
      setTheme,
    }
  },
  {
    persist: {
      pick: ['theme', 'typeface'],
      storage: piniaPluginPersistedstate.cookies(),
    },
  },
)
