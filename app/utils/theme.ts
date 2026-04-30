import type { Themes } from '@/types/app'

const themeClasses: Record<Themes, string> = {
  dark: 'bg-black text-grey',
  light: 'bg-white text-offblack',
  pink: 'bg-pink text-black',
  beige: 'bg-beige text-black',
}

export { themeClasses }
