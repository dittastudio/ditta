import type { Page, Project } from '#storyblok-components'
import type { Themes } from '@/types/app'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.client) return

  const headerTheme = useHeaderTheme()

  try {
    const story = await useStory<Page | Project>(to.path, {}, {}, {}, to.query)
    const first = story.value.content.blocks?.[0]
    headerTheme.value = first && 'theme' in first ? (first.theme as Themes) : null
  } catch {
    headerTheme.value = null
  }
})
