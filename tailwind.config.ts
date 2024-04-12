import type { Config } from 'tailwindcss'

const pixelsToRemsUnit = (pixels: number): number => {
  const remsUnit = pixels / 16

  return remsUnit
}

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

  return `clamp(${minValueRems}rem, ${intercept}rem + ${slope * 100}vw, ${maxValueRems}rem)`
}

export const screenSizes = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1200,
  base: 1440,
  '2xl': 1800,
}

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    colors: {
      white: 'rgb(255 255 255 / <alpha-value>)', // #ffffff
      black: 'rgb(0 0 0 / <alpha-value>)', // #000000
      offblack: 'rgb(25 25 25 / <alpha-value>)', // #232323
      offwhite: 'rgb(245 244 234 / <alpha-value>)', // #f5f4ea
      grey: 'rgb(50 50 50 / <alpha-value>)', // #474747
      blue: 'rgb(0 0 255 / <alpha-value>)', // #0000ff
      pink: 'rgb(255 185 185 / <alpha-value>)', // #ffb9b9
    },
    spacing: {
      4: '4px',
      8: '8px',
      12: '12px',
      16: '16px',
      20: '20px',
      24: '24px',
      32: '32px',
      40: '40px',
      48: '48px',
      64: '64px',
      80: '80px',
      96: '96px',
      120: '120px',
      160: '160px',
      240: '240px',
    },
    fontFamily: {
      heading: ['Greycliff CF', 'system-ui'],
      body: ['Greycliff CF', 'system-ui'],
    },
    fontSize: {
      10: '0.625rem',
      12: '0.75rem',
      14: '0.875rem',
      16: '1rem',
      18: '1.125rem',
      20: '1.25rem',
      24: '1.5rem',
      32: '2rem',
      38: '2.375rem',
      44: '2.75rem',
      48: '3rem',
      52: '3.25rem',
      56: '3.5rem',
      64: '4rem',
      68: '4.25rem',
      80: '5rem',
      104: '6.5rem',
      160: '10rem',
      'responsive-giga': clamp({
        minPixels: 30,
        minViewportWidthPixels: screenSizes.xs,
        maxPixels: 120,
        maxViewportWidthPixels: screenSizes.base,
      }),
      'responsive-mega': clamp({
        minPixels: 100,
        minViewportWidthPixels: screenSizes.xs,
        maxPixels: 200,
        maxViewportWidthPixels: screenSizes.base,
      }),
    },
    lineHeight: {
      tight: '0.85',
      default: '1',
      snug: '1.2',
      normal: '1.5',
    },
    letterSpacing: {
      tighter: '-0.02em',
      tight: '-0.01em',
      normal: '0',
      wide: '0.04em',
    },
    screens: {
      xs: `${screenSizes.xs}px`,
      xsMax: { max: `${screenSizes.xs - 1}px` },
      sm: `${screenSizes.sm}px`,
      smMax: { max: `${screenSizes.sm - 1}px` },
      md: `${screenSizes.md}px`,
      mdMax: { max: `${screenSizes.md - 1}px` },
      lg: `${screenSizes.lg}px`,
      lgMax: { max: `${screenSizes.lg - 1}px` },
      xl: `${screenSizes.xl}px`,
      xlMax: { max: `${screenSizes.xl - 1}px` },
      base: `${screenSizes.base}px`,
      baseMax: { max: `${screenSizes.base - 1}px` },
      '2xl': `${screenSizes['2xl']}px`,
      '2xlMax': { max: `${screenSizes['2xl'] - 1}px` },
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
    },
    extend: {},
  },
  plugins: [],
} satisfies Config
