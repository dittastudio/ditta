import type { Themes } from '@/types/app'

type Theme = {
  accent: Extract<Themes, 'pink' | 'mood' | 'olive'>
  strapline: Themes
}

export const useTheme = () => {
  return useCookie<Theme>('theme', {
    default: () => ({
      accent: 'pink',
      strapline: 'dark',
    }),
    watch: true,
  })
}
