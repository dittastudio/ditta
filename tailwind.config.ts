import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import containerQueries from '@tailwindcss/container-queries'

const pixelsToRemsUnit = (pixels: number): number => pixels / 16

interface ClampOptions {
  minPixels: number
  minViewportWidthPixels: number
  maxPixels: number
  maxViewportWidthPixels: number
}

const clamp = ({
  minPixels,
  minViewportWidthPixels,
  maxPixels,
  maxViewportWidthPixels,
}: ClampOptions) => {
  const minValueRems = pixelsToRemsUnit(minPixels)
  const maxValueRems = pixelsToRemsUnit(maxPixels)
  const minViewportWidthRems = pixelsToRemsUnit(minViewportWidthPixels)
  const maxViewportWidthRems = pixelsToRemsUnit(maxViewportWidthPixels)
  const slope = (maxValueRems - minValueRems) / (maxViewportWidthRems - minViewportWidthRems)
  const intercept = minValueRems - slope * minViewportWidthRems

  return `clamp(${minValueRems}rem, ${intercept}rem + ${slope * 100}vi, ${maxValueRems}rem)`
}

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
  'current': 'currentColor',
  'white': '#ffffff',
  'black': '#000000',
  'offwhite': '#F5F4EA',
  'offblack': '#232323',
  'grey': '#F0F1F4',
  'blue': '#B8F2FE',
  'pink': '#F8BFBE',
  'pink-darker': '#ED615E',
  'orange': '#FEDBB8',
  'orange-darker': '#FDB268',
  'green': '#B8FEC4',
  'green-darker': '#0EC32C',
  'purple': '#BEB8FE',
  'purple-darker': '#A38EF0',
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
      '1/1': '1 / 1',
      '4/3': '4 / 3',
    },
    colors: {
      ...colours,
    },
    fontFamily: {
      body: ['Greycliff CF', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      '12': ['0.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      '16': ['1rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
      '18': ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
      '20': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
      '24': ['1.5rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
      '40': ['2.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      '50': ['3.125rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      '65': ['4.0625rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      'fluid-md': [
        clamp({
          minPixels: 40,
          minViewportWidthPixels: screenSizes.xs,
          maxPixels: 65,
          maxViewportWidthPixels: screenSizes['2xl'],
        }),
        { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '500' },
      ],
      'fluid-lg': [
        clamp({
          minPixels: 80,
          minViewportWidthPixels: screenSizes.xs,
          maxPixels: 120,
          maxViewportWidthPixels: screenSizes['2xl'],
        }),
        { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '800' },
      ],
    },
    lineHeight: {
      none: '1',
      snug: '1.1',
      normal: '1.5',
    },
    letterSpacing: {
      tighter: '-0.02em',
      tight: '-0.01em',
      normal: '0',
    },
    screens,
    spacing: {
      '0': '0',
      '4': '4px',
      '8': '8px',
      '16': '16px',
      '20': '20px',
      '24': '24px',
      '32': '32px',
      '40': '40px',
      '48': '48px',
      '50': '50px',
      '56': '56px',
      '64': '64px',
      '72': '72px',
      '80': '80px',
      '88': '88px',
      '96': '96px',
      '120': '120px',
      '160': '160px',
      '200': '200px',
      '240': '240px',
      'fluid-outer-gutter': clamp({
        minPixels: 32,
        minViewportWidthPixels: screenSizes.xs,
        maxPixels: 80,
        maxViewportWidthPixels: screenSizes['2xl'],
      }),
      'fluid-vertical-rhythm': clamp({
        minPixels: 80,
        minViewportWidthPixels: screenSizes.xs,
        maxPixels: 120,
        maxViewportWidthPixels: screenSizes['2xl'],
      }),
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
      containers: {
        '3xs': '12rem',
        '2xs': '16rem',
      },
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
        '2': '2',
      },
      typography: ({ theme }: { theme: any }) => ({
        light: {
          '--tw-prose-body': theme('colors.offblack'),
        },
        dark: {
          css: {
            '--tw-prose-body': theme('colors.offwhite'),
            // '--tw-prose-headings': theme('colors.pink[900]'),
            // '--tw-prose-lead': theme('colors.pink[700]'),
            // '--tw-prose-links': theme('colors.pink[900]'),
            // '--tw-prose-bold': theme('colors.pink[900]'),
            // '--tw-prose-counters': theme('colors.pink[600]'),
            // '--tw-prose-bullets': theme('colors.pink[400]'),
            // '--tw-prose-hr': theme('colors.pink[300]'),
            // '--tw-prose-quotes': theme('colors.pink[900]'),
            // '--tw-prose-quote-borders': theme('colors.pink[300]'),
            // '--tw-prose-captions': theme('colors.pink[700]'),
            // '--tw-prose-code': theme('colors.pink[900]'),
            // '--tw-prose-pre-code': theme('colors.pink[100]'),
            // '--tw-prose-pre-bg': theme('colors.pink[900]'),
            // '--tw-prose-th-borders': theme('colors.pink[300]'),
            // '--tw-prose-td-borders': theme('colors.pink[200]'),
            // '--tw-prose-invert-body': theme('colors.pink[200]'),
            // '--tw-prose-invert-headings': theme('colors.white'),
            // '--tw-prose-invert-lead': theme('colors.pink[300]'),
            // '--tw-prose-invert-links': theme('colors.white'),
            // '--tw-prose-invert-bold': theme('colors.white'),
            // '--tw-prose-invert-counters': theme('colors.pink[400]'),
            // '--tw-prose-invert-bullets': theme('colors.pink[600]'),
            // '--tw-prose-invert-hr': theme('colors.pink[700]'),
            // '--tw-prose-invert-quotes': theme('colors.pink[100]'),
            // '--tw-prose-invert-quote-borders': theme('colors.pink[700]'),
            // '--tw-prose-invert-captions': theme('colors.pink[400]'),
            // '--tw-prose-invert-code': theme('colors.white'),
            // '--tw-prose-invert-pre-code': theme('colors.pink[300]'),
            // '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
            // '--tw-prose-invert-th-borders': theme('colors.pink[600]'),
            // '--tw-prose-invert-td-borders': theme('colors.pink[700]'),
          },
        },
      }),
    },
  },
  plugins: [
    forms,
    typography,
    containerQueries,
  ],
} satisfies Config
