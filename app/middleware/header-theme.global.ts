import type { Page, Project } from '#storyblok-components'
import type { Themes } from '@/types/app'

export default defineNuxtRouteMiddleware(async (to) => {
  const headerTheme = useHeaderTheme()
  const relations = ['block_team.humans', 'block_projects.projects']

  try {
    const story = await useStory<Page | Project>(
      to.path,
      { resolve_relations: relations },
      { resolveRelations: relations },
      {},
      to.query,
    )

    const first = story.value.content.blocks?.[0]

    headerTheme.value = first && 'theme' in first ? (first.theme as Themes) : null
  } catch {
    headerTheme.value = null
  }
})
