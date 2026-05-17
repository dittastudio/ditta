import type { Page, Project } from '#storyblok-components'
import type { Themes } from '@/types/app'

export default defineNuxtRouteMiddleware(async (to) => {
  const theme = useTheme()

  try {
    const story = await useStory<Page | Project>(to.path, {}, {}, {}, to.query)
    const first = story.value.content.blocks?.[0]

    if (first && 'theme' in first) {
      const newStrapline = first.theme as Themes

      if (import.meta.server) {
        theme.value = { ...theme.value, strapline: newStrapline }
      } else {
        const router = useRouter()
        const stop = router.afterEach(() => {
          theme.value = { ...theme.value, strapline: newStrapline }
          stop()
        })
      }
    }
  } catch (error: any) {
    console.log(error)
  }
})
