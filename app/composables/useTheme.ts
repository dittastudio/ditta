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
    const initialized = useState('theme:initialized', () => false)
    if (!initialized.value) {
      initialized.value = true
      // On prerendered pages, useState is hydrated from the build-time SSR payload
      // (no cookie context), so the user's accent preference is lost. Restore it now.
      theme.value = { ...theme.value, accent: themeCookie.value.accent }
      watch(
        theme,
        (value) => {
          themeCookie.value = value
        },
        { deep: true },
      )
    }
  }

  return theme
}
