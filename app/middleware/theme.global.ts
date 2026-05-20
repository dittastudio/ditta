import type { Page, Project } from '#storyblok-components'
import type { Themes } from '@/types/app'

export default defineNuxtRouteMiddleware(async (to) => {
  const theme = useTheme()

  try {
    const story = await useStory<Page | Project>(to.path, {}, {}, {}, to.query)
    const first = story.value.content.blocks?.[0]

    if (first && 'theme' in first) {
      const firstTheme = first.theme as Themes

      if (import.meta.server) {
        theme.value = { ...theme.value, strapline: firstTheme }
      } else {
        const router = useRouter()
        const stop = router.afterEach(() => {
          theme.value = { ...theme.value, strapline: firstTheme }
          stop()
        })
      }
    }
  } catch (error: any) {
    console.log(error)
  }
})
