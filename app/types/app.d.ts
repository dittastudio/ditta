import type { Page } from '#storyblok-components'

type BlockTypes = NonNullable<Page['blocks']>[number]

export { BlockTypes }
