import type { ISbStoriesParams, ISbStoryData, StoryblokBridgeConfigV2 } from '@storyblok/js'
import type { LocationQuery } from 'vue-router'

type UseAsyncDataOptions = Omit<Parameters<typeof useAsyncStoryblok>[1], 'api' | 'bridge'>

export async function useStory<T>(
  slug: string = '',
  api: ISbStoriesParams = {},
  bridge: StoryblokBridgeConfigV2 = {},
  options: UseAsyncDataOptions = {},
  query?: LocationQuery,
) {
  const config = useRuntimeConfig()
  const resolvedQuery = query ?? useRoute().query
  const isDraft = config.public.NUXT_STORYBLOK_VERSION !== 'published'

  const { story, error } = await useAsyncStoryblok(storyblokSlug(slug), {
    api: {
      version: isDraft ? 'draft' : 'published',
      from_release:
        typeof resolvedQuery?._storyblok_release === 'string' ? resolvedQuery?._storyblok_release : undefined,
      ...api,
    },
    bridge: {
      resolveLinks: 'url',
      preventClicks: true,
      ...bridge,
    },
    transform: (input) => {
      return input
    },
    deep: true,
    ...options,
  })

  if (error.value) {
    throw createError({
      statusCode: error.value.status || 404,
      statusMessage: `Page not found${slug ? ` for: ${slug}` : ''}`,
      fatal: true,
      cause: error.value,
    })
  }

  return story as ComputedRef<ISbStoryData<T>>
}
