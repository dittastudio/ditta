import type { Page } from '#storyblok-components'

type BlockTypes = NonNullable<Page['blocks']>[number]

type Themes = 'dark' | 'light' | 'white' | 'pink' | 'beige'

export { BlockTypes, Themes }
