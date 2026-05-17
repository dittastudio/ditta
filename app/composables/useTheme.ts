import type { Themes } from '@/types/app'

type Theme = {
  accent: Extract<Themes, 'pink' | 'mood' | 'olive'>
  strapline: Themes
}

export const useTheme = () => {
  const themeCookie = useCookie<Theme>('theme', {
    default: () => ({
      accent: 'pink',
      strapline: 'dark',
    }),
  })

  const theme = useState<Theme>('theme', () => themeCookie.value)

  watch(theme, (value) => {
    themeCookie.value = value
  })

  return theme
}
