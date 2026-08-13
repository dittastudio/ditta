import type { Themes } from '@/types/app'

const themeClasses: Record<Themes, string> = {
  dark: 'bg-black text-grey',
  light: 'bg-grey text-black',
  white: 'bg-white text-black',
  beige: 'bg-beige text-black',
  crema: 'bg-crema text-black',
  forest: 'bg-forest text-black',
  grey: 'bg-grey text-black',
  mood: 'bg-mood text-black',
  olive: 'bg-olive text-black',
  pink: 'bg-pink text-black',
  accent: 'bg-accent text-black',
}

const themeTextClasses: Record<Themes, string> = {
  dark: 'text-grey',
  light: 'text-black',
  white: 'text-black',
  beige: 'text-black',
  crema: 'text-black',
  forest: 'text-black',
  grey: 'text-black',
  mood: 'text-black',
  olive: 'text-black',
  pink: 'text-black',
  accent: 'text-black',
}

const themeBgClasses: Record<Themes, string> = {
  dark: 'bg-black',
  light: 'bg-grey',
  white: 'bg-white',
  beige: 'bg-beige',
  crema: 'bg-crema',
  forest: 'bg-forest',
  grey: 'bg-grey',
  mood: 'bg-mood',
  olive: 'bg-olive',
  pink: 'bg-pink',
  accent: 'bg-accent',
}

export { themeClasses, themeTextClasses, themeBgClasses }
