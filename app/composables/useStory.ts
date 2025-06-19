import type { ISbStoriesParams } from 'storyblok-js-client'

export const useStory = async (
  slug: string = '',
  options: ISbStoriesParams = {},
) => {
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()

  const defaultOptions: ISbStoriesParams = {
    version: runtimeConfig.public.STORYBLOK_VERSION === 'published' ? 'published' : 'draft',
    from_release: String(route.query?._storyblok_release) || undefined,
    resolve_relations: [],
  }

  const story = await useAsyncStoryblok(
    storyblokSlug(slug),
    { ...defaultOptions, ...options },
  )

  if (!story.value) {
    throw createError({
      statusCode: 404,
      statusMessage: `Page not found`,
      fatal: true,
    })
  }

  return story
}
