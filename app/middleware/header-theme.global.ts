import type { Themes } from '@/types/app'

export default defineNuxtRouteMiddleware(async (to) => {
  const headerTheme = useHeaderTheme()

  try {
    const story = await usePageStory(to.path, to.query)

    if (isProject(story.value)) {
      const first = story.value.content.blocks?.[0]
      headerTheme.value = first && 'theme' in first ? (first.theme as Themes) : null
    } else {
      headerTheme.value = null
    }
  } catch {
    headerTheme.value = null
  }
})
