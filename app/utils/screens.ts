// Grab breakpoints from Tailwind CSS main.css
const getBreakpoint = (breakpoint: string): number => {
  if (!import.meta.client) {
    return 0
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(`--breakpoint-${breakpoint}`)

  return value ? Number.parseInt(value, 10) : 0
}

// Generate media query string
export const getMediaQuery = (breakpoint: string): string => {
  const isMax = breakpoint.startsWith('max-')
  const cleanBreakpoint = isMax ? breakpoint.slice(4) : breakpoint
  const value = getBreakpoint(cleanBreakpoint)

  return isMax ? `(max-width: ${value - 1}px)` : `(min-width: ${value}px)`
}
