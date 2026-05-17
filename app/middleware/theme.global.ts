import type { Page, Project } from '#storyblok-components'
import type { Themes } from '@/types/app'

export default defineNuxtRouteMiddleware(async (to) => {
  const theme = useTheme()

  try {
    const story = await useStory<Page | Project>(to.path, {}, {}, {}, to.query)
    const first = story.value.content.blocks?.[0]

    if (first && 'theme' in first) {
      theme.value = { ...theme.value, strapline: first.theme as Themes }
    }
  } catch (error: any) {
    console.log(error)
  }
})
