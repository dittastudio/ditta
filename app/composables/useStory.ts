import type { ISbStoriesParams, ISbStoryData, StoryblokBridgeConfigV2 } from '@storyblok/js'

type UseAsyncDataOptions = Omit<Parameters<typeof useAsyncStoryblok>[1], 'api' | 'bridge'>

export async function useStory<T>(
  slug: string = '',
  api: ISbStoriesParams = {},
  bridge: StoryblokBridgeConfigV2 = {},
  options: UseAsyncDataOptions = {},
) {
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()

  const { story, error } = await useAsyncStoryblok(
    storyblokSlug(slug),
    {
      api: {
        version: runtimeConfig.public.STORYBLOK_VERSION === 'published' ? 'published' : 'draft',
        from_release: typeof route.query?._storyblok_release === 'string' ? route.query?._storyblok_release : undefined,
        ...api,
      },
      bridge: {
        resolveLinks: 'url',
        preventClicks: true,
        ...bridge,
      },
      deep: true,
      ...options,
    },
  )

  if (error.value) {
    throw createError({
      statusCode: error.value.statusCode || 404,
      statusMessage: `Page not found${slug ? ` for: ${slug}` : ''}`,
      fatal: true,
      cause: error.value,
    })
  }

  return story as ComputedRef<ISbStoryData<T>>
}
