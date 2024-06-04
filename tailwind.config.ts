import type { Config } from 'tailwindcss'

export const screenSizes = {
  'zero': 0,
  'xs': 375,
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1200,
  '2xl': 1440,
  '3xl': 1920,
}

export const screens = {
  'xs': `${screenSizes.xs}px`,
  'xsMax': { max: `${screenSizes.xs - 1}px` },
  'sm': `${screenSizes.sm}px`,
  'smMax': { max: `${screenSizes.sm - 1}px` },
  'md': `${screenSizes.md}px`,
  'mdMax': { max: `${screenSizes.md - 1}px` },
  'lg': `${screenSizes.lg}px`,
  'lgMax': { max: `${screenSizes.lg - 1}px` },
  'xl': `${screenSizes.xl}px`,
  'xlMax': { max: `${screenSizes.xl - 1}px` },
  '2xl': `${screenSizes['2xl']}px`,
  '2xlMax': { max: `${screenSizes['2xl'] - 1}px` },
  '3xl': `${screenSizes['3xl']}px`,
  '3xlMax': { max: `${screenSizes['3xl'] - 1}px` },
}

export const colours = {
  white: '#ffffff',
  black: '#000000',
  offwhite: '#f5f4ea',
  offblack: '#232323',
  grey: '#474747',
  blue: '#676EF6',
  'blue-light': '#9ed5ff',
  pink: '#ffb9b9',
  orange: '#F3AF4C',
  yellow: '#ffdb66',
  'yellow-light': '#F3ECD7',
  red: '#ff627e',
  green: '#00674e',
}

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './utilities/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    aspectRatio: {
      '16/9': '16 /9',
      '9/16': '9 / 16',
      '8/9': '8 / 9',
      '3/2': '3 / 2',
      '2/3': '2 / 3',
      '4/3': '4 / 3',
      '3/4': '3 / 4',
      '1/1': '1 / 1',
      '1/1.414': '1 / 1.414', // A4 Paper
    },
    colors: {
      ...colours,
    },
    fontFamily: {
      body: ['Greycliff CF', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      '10': '0.625rem',
      '12': '0.75rem',
      '14': '0.875rem',
      '16': '1rem',
      '18': '1.125rem',
      '20': '1.25rem',
      '24': '1.5rem',
      '32': '2rem',
      '38': '2.375rem',
      '44': '2.75rem',
      '52': '3.25rem',
      '64': '4rem',
      '80': '5rem',
      '104': '5.625rem',
    },
    lineHeight: {
      none: '1',
      tight: '0.85',
      snug: '1.2',
      normal: '1.5',
    },
    letterSpacing: {
      tighter: '-0.02em',
      tight: '-0.01em',
      normal: '0',
      wide: '0.04em',
    },
    screens,
    spacing: {
      0: '0',
      4: '4px',
      8: '8px',
      16: '16px',
      24: '24px',
      32: '32px',
      40: '40px',
      48: '48px',
      56: '56px',
      64: '64px',
      72: '72px',
      80: '80px',
      88: '88px',
      96: '96px',
      120: '120px',
      160: '160px',
      200: '200px',
      240: '240px',
    },
    transitionTimingFunction: {
      smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0.0, 1, 1)',
      out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      inExpo: 'cubic-bezier(0.7, 0, 0.84, 0)',
      outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      inOutExpo: 'cubic-bezier(0.87, 0, 0.13, 1)',
      inQuart: 'cubic-bezier(0.5, 0, 0.75, 0)',
      outQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      inOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
      inBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
      outBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      inOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    extend: {
      transitionDuration: {
        175: '175ms',
        250: '250ms',
        350: '350ms',
        400: '400ms',
        450: '450ms',
        600: '600ms',
        800: '800ms',
        900: '900ms',
        1500: '1500ms',
        2000: '2000ms',
        3000: '3000ms',
      },
      transitionDelay: {
        175: '175ms',
        250: '250ms',
        350: '350ms',
        400: '400ms',
        450: '450ms',
        600: '600ms',
        800: '800ms',
        900: '900ms',
        1500: '1500ms',
        2000: '2000ms',
        3000: '3000ms',
      },
      zIndex: {
        '-1': '-1',
        '1': '1',
      },
    },
  },
  plugins: [],
} satisfies Config
