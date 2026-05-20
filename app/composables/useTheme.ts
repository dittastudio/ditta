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

  if (import.meta.client) {
    watch(
      theme,
      (value) => {
        themeCookie.value = value
      },
      { deep: true }, // Without deep: true, Vue only fires when theme.value is replaced (new reference), not when a nested property mutates. So cookie never updates.
    )
  }

  return theme
}
