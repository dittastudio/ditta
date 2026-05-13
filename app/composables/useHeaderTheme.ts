import type { Themes } from '@/types/app'

export const useHeaderTheme = () => useState<Themes | null>('header-theme', () => null)
