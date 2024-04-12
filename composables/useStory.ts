import { storyblokSlug } from '@/utilities/helpers'
import type { Ref } from 'vue'
import type { ISbStoryData, ISbStoriesParams } from 'storyblok-js-client'

const useStory = async <T>(
  slug: string = '',
  options: ISbStoriesParams = {}
): Promise<Ref<ISbStoryData<T>>> => {
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()
  const storyblokApi = useStoryblokApi()
  const release = String(route.query?._storyblok_release) || undefined
  const storyBlokSlug = storyblokSlug(slug)

  const defaultOptions: ISbStoriesParams = {
    version: runtimeConfig.public.STORYBLOK_VERSION === 'published' ? 'published' : 'draft',
    from_release: release,
    resolve_relations: []
  }

  const config = { ...defaultOptions, ...options }

  const { data } = await useAsyncData(
    storyBlokSlug,
    async () => await storyblokApi.get(`cdn/stories${storyBlokSlug}`, config)
  )

  return ref(data.value?.data?.story)
}

export { useStory }
