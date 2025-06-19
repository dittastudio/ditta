import type { RichtextStoryblok } from '@@/types/storyblok'
import type { ImageModifiers } from '@nuxt/image'
import type { LocationQuery } from 'vue-router'

const storyblokEditor = (search: LocationQuery) => '_storyblok' in search

const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
const videoExtensions = ['mp4', 'webm', 'ogg']

const storyblokAssetType = (filename: string): 'image' | 'video' | 'other' => {
  if (typeof filename !== 'string' || !filename?.trim().length) {
    return 'other'
  }

  const ext = filename.split('.').pop() || ''

  if (imageExtensions.includes(ext)) {
    return 'image'
  }

  else if (videoExtensions.includes(ext)) {
    return 'video'
  }

  return 'other'
}

const storyblokImageUrlUpdate = (url: string) => url.replace('//a.storyblok.com', '//a2.storyblok.com')

const storyblokImage = (
  filename: string | null | undefined,
  modifiers?: Partial<ImageModifiers> | undefined,
): string => {
  const image = useImage()

  const path = image(filename ?? '', {
    width: 0,
    height: 0,
    smart: false, // Must be set to false if focal point is used
    quality: 80,
    blur: 0,
    focal: '',
    format: 'webp',
    ...modifiers,
  })

  return path
}

const storyblokRichTextContent = (richtext: RichtextStoryblok | undefined): boolean => Boolean(richtext?.content?.[0]?.content?.length)

const storyblokSlug = (path: string): string =>
  ['/', ''].includes(path) ? '/home' : path.replace(/\/+$/, '')

const storyblokImageDimensions = (
  filename: string | null | undefined,
): { width: number, height: number } => {
  if (!filename?.length) {
    return {
      width: 0,
      height: 0,
    }
  }

  const [width, height] = filename.split('/')[5]?.split('x') ?? ['0', '0']

  return { width: Number(width), height: Number(height) }
}

export {
  storyblokAssetType,
  storyblokEditor,
  storyblokImage,
  storyblokImageDimensions,
  storyblokImageUrlUpdate,
  storyblokRichTextContent,
  storyblokSlug,
}
