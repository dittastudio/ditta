// Reads a block's headings and paragraphs off the page as the lines Mario platforms on. DOM reads only: no Vue.
import type { Blocks, Line } from '@/utils/mario/physics'

let metricsContext: CanvasRenderingContext2D | null = null
const metricsCache = new Map<string, { ascent: number; descent: number; cap: number }>() // by font

// Ascent and descent locate the baseline within a line rect; H's ink gives the cap height
export const fontMetrics = (el: Element) => {
  const style = getComputedStyle(el)
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const cached = metricsCache.get(font)
  if (cached) return cached

  metricsContext ??= document.createElement('canvas').getContext('2d')
  if (!metricsContext) return { ascent: 0, descent: 0, cap: 0 }

  metricsContext.font = font
  const metrics = metricsContext.measureText('H')
  const result = {
    ascent: metrics.fontBoundingBoxAscent,
    descent: metrics.fontBoundingBoxDescent,
    cap: metrics.actualBoundingBoxAscent,
  }

  // Not until it's loaded, as these are the fallback's until then
  if (document.fonts.check(font)) metricsCache.set(font, result)

  return result
}

// In sprite px from the stage's top left. The heading's lines come back separately, for the box that sits over it.
export const measureTextPlatforms = (root: HTMLElement, stageRect: DOMRect, scale: number) => {
  const toX = (value: number) => (value - stageRect.left) / scale
  const toY = (value: number) => (value - stageRect.top) / scale
  const range = document.createRange()

  const elements = [...root.querySelectorAll('h2, p')]
  const measured = elements.map((block) => {
    const lines: Line[] = []
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.parentElement) continue

      const { ascent, descent, cap } = fontMetrics(node.parentElement)

      // Word by word, so spaces at line ends never count as platform
      for (const word of (node.textContent ?? '').matchAll(/\S+/g)) {
        range.setStart(node, word.index)
        range.setEnd(node, word.index + word[0].length)

        for (const rect of range.getClientRects()) {
          // Half-leading is split evenly, so the baseline sits the same distance from the centre either way
          const bottom = toY((rect.top + rect.bottom) / 2 + (ascent - descent) / 2)
          const top = bottom - cap / scale
          const line = lines.find((line) => Math.abs(line.bottom - bottom) < 1)

          if (line) {
            line.left = Math.min(line.left, toX(rect.left))
            line.right = Math.max(line.right, toX(rect.right))
            line.top = Math.min(line.top, top)
          } else {
            lines.push({ left: toX(rect.left), right: toX(rect.right), top, bottom })
          }
        }
      }
    }

    return lines
  })

  const heading = measured[elements.findIndex((element) => element.tagName === 'H2')] ?? []
  const blocks: Blocks = measured.filter((lines) => lines.length)

  return { blocks, heading }
}
