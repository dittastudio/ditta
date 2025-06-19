import { deburr } from 'lodash-es'

const calculateAspectRatio = (width: number, height: number, newWidth: number = 100): string => {
  const aspectRatioWidth = newWidth
  const aspectRatioHeight = Math.round((height / width) * aspectRatioWidth)

  return `${aspectRatioWidth}:${aspectRatioHeight}`
}

const ratioDimensions = (
  ratio: App.TAspectRatios | string | number,
): App.ImageDimensions => {
  const parts = ratio.toString().split(':').map((num: string): number => Number(num))

  return {
    width: parts[0] ?? 0,
    height: parts[1] ?? 0,
  }
}

const safeKebabCase = (str: string) => {
  const deburred = deburr(str)

  const cleanedStr = deburred
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .trim()
    .replace(/^-+|-+$/g, '')

  return cleanedStr
}

const wait = (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms))

const validAspectRatio = (ratio: string | number = '') => {
  const pattern = /[0-9.]+:[0-9.]+/

  return pattern.test(String(ratio))
}

const inOutQuart = (t: number): number => {
  if (t < 0.5) {
    return 8 * t * t * t * t
  }
  return 1 - (-2 * t + 2) ** 4 / 2
}

const scrollToWithEasing = (target: number | string | HTMLElement, duration: number = 1000, scrollToBottom: boolean = false): void => {
  const element = typeof target === 'string' && target.length
    ? document.querySelector(target) as HTMLElement
    : target instanceof HTMLElement
      ? target
      : null

  if (!element && typeof target !== 'number') {
    return
  }

  const startPosition = window.scrollY
  const targetPosition = typeof target === 'number'
    ? target
    : element!.offsetTop + (scrollToBottom ? element!.offsetHeight - window.innerHeight : 0)
  const distance = targetPosition - startPosition
  const startTime = performance.now()

  const animateScroll = (currentTime: number) => {
    const progress = Math.min((currentTime - startTime) / duration, 1)

    window.scrollTo(0, startPosition + distance * inOutQuart(progress))

    if (progress < 1) {
      requestAnimationFrame(animateScroll)
    }
  }

  requestAnimationFrame(animateScroll)
}

export {
  calculateAspectRatio,
  ratioDimensions,
  safeKebabCase,
  scrollToWithEasing,
  validAspectRatio,
  wait,
}
