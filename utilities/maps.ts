const colourText: Record<string, string> = {
  white: 'text-white',
  black: 'text-black',
  offwhite: 'text-offwhite',
  offblack: 'text-offblack',
  grey: 'text-grey',
  blue: 'text-blue',
  pink: 'text-pink',
  orange: 'text-orange',
  green: 'text-green',
} as const

const colourBackground: Record<string, string> = {
  white: 'bg-white',
  black: 'bg-black',
  offwhite: 'bg-offwhite',
  offblack: 'bg-offblack',
  grey: 'bg-grey',
  blue: 'bg-blue',
  pink: 'bg-pink',
  orange: 'bg-orange',
  green: 'bg-green',
} as const

const ratioMap: Record<string, string> = {
  'auto': '',
  '1:1': 'aspect-1/1',
  '3:2': 'aspect-3/2',
} as const

export { colourText, colourBackground, ratioMap }
