import { breakpoints, type Breakpoint } from './breakpoints'

export const getMediaQuery = (breakpoint: string): string => {
  const isMax = breakpoint.startsWith('max-')
  const key = (isMax ? breakpoint.slice(4) : breakpoint) as Breakpoint
  const value = breakpoints[key]

  return isMax ? `(max-width: ${value - 1}px)` : `(min-width: ${value}px)`
}

// Matches the only-touch variant in assets/css/utils.css
export const isTouch = (): boolean => matchMedia('(hover: none)').matches

// enterkeyhint only means anything on a field that brings up the keyboard, and every brief text field sets it.
// The cards (buttons) and the slider (a range input) don't.
export const opensKeyboard = (el: EventTarget | null | undefined): boolean =>
  el instanceof HTMLElement && el.hasAttribute('enterkeyhint')

// An on-screen keyboard shrinks the visual viewport by well over a quarter; browser chrome sliding away never does
export const isKeyboardOpen = (): boolean =>
  !!window.visualViewport && window.visualViewport.height < window.innerHeight * 0.75
