import type { AsyncDataOptions } from '#app'
import type { ISbStories, ISbStoriesParams, ISbStoryData } from '@storyblok/js'
import type { LocationQuery } from 'vue-router'

type UseAsyncDataOptions<T> = Omit<AsyncDataOptions<ISbStories<T>>, 'transform'>

export async function useStories<T>(
  slug: string = '',
  api: ISbStoriesParams = {},
  options: UseAsyncDataOptions<T> = {},
  query?: LocationQuery,
) {
  const config = useRuntimeConfig()
  const storyblokApi = useStoryblokApi()
  const resolvedQuery = query ?? useRoute().query
  const isPublished = config.public.STORYBLOK_VERSION === 'published'
  const folder = slug.replace(/^\/+|\/+$/g, '')

  const params: ISbStoriesParams = {
    version: isPublished ? 'published' : 'draft',
    from_release: typeof resolvedQuery?._storyblok_release === 'string' ? resolvedQuery?._storyblok_release : undefined,
    starts_with: folder ? `${folder}/` : undefined,
    is_startpage: false,
    resolve_links: 'url',
    per_page: 25,
    ...api,
  }

  const { data, error } = await useAsyncData(
    `stories:${folder}:${JSON.stringify(api)}`,
    async () => (await storyblokApi.get('cdn/stories', params)) as ISbStories<T>,
    {
      deep: true,
      ...options,
    },
  )

  if (error.value) {
    throw createError({
      statusCode: error.value.status || 404,
      statusMessage: `Stories not found${slug ? ` for: ${slug}` : ''}`,
      fatal: true,
      cause: error.value,
    })
  }

  const stories = computed(() => data.value?.data?.stories ?? [])

  return stories as ComputedRef<ISbStoryData<T>[]>
}
