import type { Ref } from 'vue'
import type { ISbStoriesParams, ISbStoryData } from 'storyblok-js-client'
import { storyblokSlug } from '@/utilities/storyblok'

export const useStoryblokStory = async <T>(
  slug: string = '',
  options: ISbStoriesParams = {},
): Promise<Ref<ISbStoryData<T> | null>> => {
  if (!slug?.length) {
    return ref(null)
  }

  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()
  const storyblokApi = useStoryblokApi()
  const release = String(route.query?._storyblok_release) || undefined
  const storyBlokSlug = storyblokSlug(slug)

  const defaultOptions: ISbStoriesParams = {
    version: runtimeConfig.public.STORYBLOK_VERSION === 'published' ? 'published' : 'draft',
    from_release: release,
    resolve_relations: [],
  }

  const config = { ...defaultOptions, ...options }

  const { data, error } = await useAsyncData(
    storyBlokSlug,
    async () => await storyblokApi.get(`cdn/stories${storyBlokSlug}`, config),
  )

  if (!data.value?.data?.story || error.value) {
    throw createError({
      statusCode: 404,
      statusMessage: `Page not found`,
      fatal: true,
    })
  }

  return ref(data.value?.data?.story)
}
