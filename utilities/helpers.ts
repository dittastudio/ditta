import type { LocationQuery } from 'vue-router'

const isStoryblokEditor = (search: LocationQuery) => '_storyblok' in search

const randomNumberInRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const storyblokSlug = (path: string): string =>
  ['/', ''].includes(path) ? '/home' : path.replace(/\/+$/, '')

interface IImageTransformOptions {
  width: number
  height: number
  smart?: boolean
  quality?: number
  blur?: number
}

const storyblokImageDimensions = (
  filename: string | null | undefined
): { width: number; height: number } => {
  if (!filename?.length) {
    return {
      width: 0,
      height: 0
    }
  }

  const [width, height] = filename.split('/')[5].split('x')

  return { width: Number(width), height: Number(height) }
}

const storyblokImage = (
  filename: string | null | undefined,
  options?: IImageTransformOptions | undefined
): string => {
  if (!filename?.length) return ''

  const settings: IImageTransformOptions = {
    width: 0,
    height: 0,
    smart: false,
    quality: 90,
    blur: 0,
    ...options
  }

  const filterProperties: Record<string, string> = {
    blur: settings.blur && settings.blur > 0 ? `:blur(${settings.blur})` : '',
    quality: `:quality(${settings.quality})`
  }

  const filters: string = Object.values(filterProperties)
    .map(item => item.trim())
    .filter(item => item.length)
    .join('')

  const transforms = `m/${settings.width}x${settings.height}${
    settings.smart ? '/smart' : ''
  }/filters${filters}`
  const path = `${filename}/${transforms}`.replace('//a.storyblok.com', '//a2.storyblok.com')

  return path
}

const ratioDimensions = (
  maxWidth: number,
  dimensions: Ditta.ImageDimensions,
  ratio: string
): Ditta.ImageDimensions => {
  const width = maxWidth !== 0 && maxWidth < dimensions.width ? maxWidth : dimensions.width
  let ratioCalc = dimensions.height / dimensions.width

  if (['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'].includes(ratio)) {
    const parts = ratio.split(':').map((num: string): number => Number(num))
    ratioCalc = parts[1] / parts[0]
  }

  const newHeight = Math.round(ratioCalc * width)

  return {
    width: width,
    height: newHeight
  }
}

const wait = (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms))

const nl2br = (input: string): string => input.replace(/\n/g, '<br>')

const sleep = async (ms: number): Promise<void> =>
  new Promise<void>(resolve => setTimeout(resolve, ms))

const requestDelay = async <T>(promise: T, ms: number = 1000) => {
  const [p] = await Promise.all([promise, sleep(ms)])

  return p
}

const hasRichTextContent = (richtext: any): boolean => {
  return Boolean(richtext?.content?.[0]?.content?.length)
}

export {
  isStoryblokEditor,
  randomNumberInRange,
  storyblokSlug,
  storyblokImageDimensions,
  storyblokImage,
  ratioDimensions,
  wait,
  nl2br,
  sleep,
  requestDelay,
  hasRichTextContent,
}
