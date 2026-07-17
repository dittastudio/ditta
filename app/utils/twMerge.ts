import { extendTailwindMerge } from 'tailwind-merge'

export const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: ['rounded-0', 'rounded-20'],
      'font-size': [
        'text-11',
        'text-14',
        'text-16',
        'text-20',
        'text-24',
        'text-28',
        'text-40',
        'text-64',
        'text-120',
        'text-160',
        'text-180',
      ],
      'text-color': [
        'text-white',
        'text-black',
        'text-beige',
        'text-crema',
        'text-forest',
        'text-grey',
        'text-mood',
        'text-olive',
        'text-pink',
        'text-red',
        'text-accent',
      ],
    },
  },
})
