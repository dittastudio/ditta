export const breakpoints = {
  '2xs': 375,
  xs: 480,
  sm: 600,
  md: 800,
  lg: 1200,
  xl: 1440,
  '2xl': 1800,
} as const

export type Breakpoint = keyof typeof breakpoints
