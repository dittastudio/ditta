import type { ISbStoryData } from 'storyblok-js-client'
import type { SitemapUrlInput } from '#sitemap/types'
import { defineSitemapEventHandler } from '#imports'
import StoryblokClient from 'storyblok-js-client'

export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig().public

  const storyblokApi = new StoryblokClient({
    accessToken: config.STORYBLOK_TOKEN,
    region: 'eu',
  })

  try {
    const response = await storyblokApi.getAll('cdn/stories', {
      version: 'draft',
      page: 1,
      per_page: 100,
      excluding_slugs: 'settings,clients*,people*',
      excluding_fields: 'blocks,hero,seo_title,category,author,seo_description,seo_image',
    })

    const pages = response.map((link: ISbStoryData) => ({
      loc: link.slug === 'home' ? '/' : `/${link.full_slug}`,
      lastmod: link.updated_at,
      _sitemap: 'pages',
    }))

    return pages satisfies SitemapUrlInput[]
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch sitemap data: ${error.message}`,
      fatal: true,
    })
  }
})
