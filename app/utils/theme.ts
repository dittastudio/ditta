import type { Themes } from '@/types/app'

const themeClasses: Record<Themes, string> = {
  dark: 'bg-black text-grey',
  light: 'bg-grey text-black',
  white: 'bg-white text-black',
  pink: 'bg-pink text-black',
  beige: 'bg-beige text-black',
  accent: 'bg-accent text-black',
}

const themeTextClasses: Record<Themes, string> = {
  dark: 'text-grey',
  light: 'text-black',
  white: 'text-black',
  pink: 'text-black',
  beige: 'text-black',
  accent: 'text-black',
}

const themeBgClasses: Record<Themes, string> = {
  dark: 'bg-black',
  light: 'bg-grey',
  white: 'bg-white',
  pink: 'bg-pink',
  beige: 'bg-beige',
  accent: 'bg-accent',
}

export { themeClasses, themeTextClasses, themeBgClasses }
