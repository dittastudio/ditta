import type { Block, Blocks } from '#storyblok-schema'
import type { ISbStoryData } from '@storyblok/js'
import type { RichTextFieldValue } from '@storyblok/schema'
import type { ImageModifiers } from '@nuxt/image'
import type { LocationQuery } from 'vue-router'

interface Entry {
  id: number
  value: string
  name: string
}

const getCategoryEntry = (value?: string | string[] | number, entries?: Entry[]): Entry | undefined => {
  if (Array.isArray(entries) && value) {
    const category = Array.isArray(value) ? value[0] : value
    const entry = entries.find((entry: Entry) => entry.value === category)
    return (entry as Entry) ?? undefined
  }

  return undefined
}

const storyblokEditor = (search: LocationQuery) => '_storyblok' in search

const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif']
const videoExtensions = ['mp4', 'webm', 'ogg']

const storyblokAssetType = (filename: string): 'image' | 'video' | 'other' => {
  if (!filename || typeof filename !== 'string' || !filename?.trim().length) {
    return 'other'
  }

  const ext = filename.split('.').pop() || ''

  if (imageExtensions.includes(ext)) {
    return 'image'
  } else if (videoExtensions.includes(ext)) {
    return 'video'
  }

  return 'other'
}

const storyblokRichTextContent = (richtext?: RichTextFieldValue | null): boolean => {
  const node = richtext?.content?.[0]
  return Boolean(node && 'content' in node && node.content?.length)
}

// `options` fields with `source: 'internal_stories'` are typed as UUID strings, because
// that is what the API returns by default. Asking for the field in `resolve_relations`
// swaps each UUID for the full story inline — a substitution the schema cannot express,
// so widen here and drop any UUID the CDN left unresolved.
const storyblokRelations = <TName extends Blocks['name']>(
  uuids: string[] | null | undefined,
): ISbStoryData<Block<TName>>[] => {
  const entries = (uuids ?? []) as unknown as (ISbStoryData<Block<TName>> | string)[]
  return entries.filter((entry): entry is ISbStoryData<Block<TName>> => typeof entry !== 'string')
}

// Singular counterpart to `storyblokRelations`, for `option` (not `options`) relation
// fields — resolved to a full story when requested via `resolve_relations`, otherwise
// left as the raw UUID string the schema types it as.
const storyblokRelation = <TName extends Blocks['name']>(
  uuid: string | null | undefined,
): ISbStoryData<Block<TName>> | undefined => {
  const entry = uuid as unknown as ISbStoryData<Block<TName>> | string | undefined
  return typeof entry === 'string' || !entry ? undefined : entry
}

// The content each relation is read for. Everything else on a resolved story is dropped by `pruneRelations`, so a field
// a component starts reading from a relation has to be added here too.
const storyRelationFields: Record<string, string[]> = {
  'block_team.humans': ['image', 'name', 'position'],
  'block_projects.projects': ['title', 'headline', 'media'],
  'post.author': ['image', 'name'],
}

// Shared because `useAsyncStoryblok` keys on the slug and api options: callers fetching the same
// page story must pass identical relations to share one request and payload entry.
const storyRelations = Object.keys(storyRelationFields)

const pruneRelation = (relation: unknown, fields: string[]): unknown => {
  if (!relation || typeof relation !== 'object') return relation // a UUID the CDN left unresolved

  const { uuid, full_slug, content } = relation as ISbStoryData<Record<string, unknown>>

  return { uuid, full_slug, content: Object.fromEntries(fields.map((field) => [field, content[field]])) }
}

// Resolving a relation inlines its whole story, and a project's story holds every block on its page, all of which would
// otherwise ship in the page's payload. Copies rather than edits, as the Storyblok client caches what it returns.
const pruneRelations = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map((item) => pruneRelations(item)) as T
  if (!value || typeof value !== 'object') return value

  const { component } = value as { component?: string }

  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => {
      const fields = storyRelationFields[`${component}.${key}`]

      if (!fields) return [key, pruneRelations(field)]

      return [
        key,
        Array.isArray(field) ? field.map((item) => pruneRelation(item, fields)) : pruneRelation(field, fields),
      ]
    }),
  ) as T
}

const storyblokSlug = (path: string): string => (['', '/'].includes(path) ? '/home' : path.replace(/\/+$/, ''))

const isMediaImage = (
  media: Block<'element_media_image'> | Block<'element_media_autoplay'>,
): media is Block<'element_media_image'> => media.component === 'element_media_image'
const isMediaAutoplay = (
  media: Block<'element_media_image'> | Block<'element_media_autoplay'>,
): media is Block<'element_media_autoplay'> => media.component === 'element_media_autoplay'

type ContentTypes = Block<'page'> | Block<'project'> | Block<'post'>

const isPage = (story: ISbStoryData<ContentTypes> | null | undefined): story is ISbStoryData<Block<'page'>> =>
  Boolean(story?.content?.component === 'page')

const isProject = (story: ISbStoryData<ContentTypes> | null | undefined): story is ISbStoryData<Block<'project'>> =>
  Boolean(story?.content?.component === 'project')

const isPost = (story: ISbStoryData<ContentTypes> | null | undefined): story is ISbStoryData<Block<'post'>> =>
  Boolean(story?.content?.component === 'post')

const storyblokImage = (filename: string | null | undefined, modifiers?: Partial<ImageModifiers>): string => {
  const image = useImage()

  const path = image(filename ?? '', {
    width: 0,
    height: 0,
    smart: false,
    quality: 80,
    blur: 0,
    format: 'webp',
    ...modifiers,
  })

  return path
}

const storyblokImageDimensions = (filename: string | null | undefined): { width: number; height: number } => {
  if (!filename?.length) {
    return {
      width: 0,
      height: 0,
    }
  }

  const parts = filename.split('/')

  if (!parts[5]?.includes('x')) {
    return {
      width: 0,
      height: 0,
    }
  }

  const [width, height] = parts[5].split('x')

  return { width: Number(width), height: Number(height) }
}

export {
  getCategoryEntry,
  isMediaImage,
  isMediaAutoplay,
  isPage,
  isProject,
  isPost,
  pruneRelations,
  storyRelations,
  storyblokAssetType,
  storyblokEditor,
  storyblokImage,
  storyblokImageDimensions,
  storyblokRelation,
  storyblokRelations,
  storyblokRichTextContent,
  storyblokSlug,
}
