// import { colours } from '@/tailwind.config'

// type ColourKey = keyof typeof colours

// const textClasses = Object.keys(colours).reduce<Record<ColourKey, string>>(
//   (acc, key) => {
//     const colourKey: ColourKey = key as ColourKey // Ensure 'key' is treated as a ColourKey
//     acc[colourKey] = `text-${colourKey}`
//     return acc
//   },
//   {} as Record<ColourKey, string>,
// )

// const colourText: Record<ColourKey, string> = {
//   ...textClasses,
// } as const

const colourText: Record<string, string> = {
  'current': 'text-current',
  'white': 'text-white',
  'black': 'text-black',
  'offwhite': 'text-offwhite',
  'offblack': 'text-offblack',
  'grey': 'text-grey',
  'blue': 'text-blue',
  'pink': 'text-pink',
  'pink-darker': 'text-pink-darker',
  'orange': 'text-orange',
  'orange-darker': 'text-orange-darker',
  'green': 'text-green',
  'green-lighter': 'text-green-lighter',
  'green-darker': 'text-green-darker',
  'purple': 'text-purple',
  'purple-darker': 'text-purple-darker',
} as const

const colourBackground: Record<string, string> = {
  'current': 'bg-current',
  'white': 'bg-white',
  'black': 'bg-black',
  'offwhite': 'bg-offwhite',
  'offblack': 'bg-offblack',
  'grey': 'bg-grey',
  'blue': 'bg-blue',
  'pink': 'bg-pink',
  'pink-darker': 'bg-pink-darker',
  'orange': 'bg-orange',
  'orange-darker': 'bg-orange-darker',
  'green': 'bg-green',
  'green-lighter': 'bg-green-lighter',
  'green-darker': 'bg-green-darker',
  'purple': 'bg-purple',
  'purple-darker': 'bg-purple-darker',
} as const

const ratioMap: Record<string, string> = {
  'auto': '',
  '1:1': 'aspect-1/1',
  '3:2': 'aspect-3/2',
} as const

export { colourText, colourBackground, ratioMap }
