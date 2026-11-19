import { breakpoints, type Breakpoint } from './breakpoints'

export const getMediaQuery = (breakpoint: string): string => {
  const isMax = breakpoint.startsWith('max-')
  const key = (isMax ? breakpoint.slice(4) : breakpoint) as Breakpoint
  const value = breakpoints[key]

  return isMax ? `(max-width: ${value - 1}px)` : `(min-width: ${value}px)`
}

// Matches the only-touch variant in assets/css/utils.css
export const isTouch = (): boolean => matchMedia('(hover: none)').matches
