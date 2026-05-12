import type { Page, Project } from '#storyblok-components'

const relations = ['block_team.humans', 'block_projects.projects']

export const usePageStory = (path: string) =>
  useStory<Page | Project>(path, { resolve_relations: relations }, { resolveRelations: relations })
