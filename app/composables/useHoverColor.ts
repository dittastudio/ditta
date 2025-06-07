/**
 * Composable for handling dynamic hover background colors
 * Allows any hex value to be used for background color changes
 */
export const useHoverColor = () => {
  const currentHoverColor = ref<string | null>(null)

  const setHoverColor = (color: string | null) => {
    currentHoverColor.value = color

    if (color) {
      document.documentElement.style.setProperty('--dynamic-hover-color', color)
      document.body.classList.add('has-hover-color')
    }
    else {
      document.documentElement.style.removeProperty('--dynamic-hover-color')
      document.body.classList.remove('has-hover-color')
    }
  }

  const setupHoverElement = (element: HTMLElement, color: string) => {
    const handleMouseEnter = () => setHoverColor(color)
    const handleMouseLeave = () => setHoverColor(null)

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    // Return cleanup function
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }

  return {
    currentHoverColor: readonly(currentHoverColor),
    setHoverColor,
    setupHoverElement,
  }
}
