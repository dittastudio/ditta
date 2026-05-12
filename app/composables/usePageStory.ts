import type { Page, Project } from '#storyblok-components'
import type { LocationQuery } from 'vue-router'

const relations = ['block_team.humans', 'block_projects.projects']

export const usePageStory = (path: string, query?: LocationQuery) =>
  useStory<Page | Project>(path, { resolve_relations: relations }, { resolveRelations: relations }, {}, query)
