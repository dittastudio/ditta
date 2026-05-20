import type { Themes } from '@/types/app'

export const useBlockTheme = () => useState<Themes | null>('blockTheme', () => null)
