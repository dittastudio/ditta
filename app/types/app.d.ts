import type { Page } from '#storyblok-components'

type BlockTypes = NonNullable<Page['blocks']>[number]

type Themes = 'dark' | 'light' | 'white' | 'beige' | 'crema' | 'forest' | 'grey' | 'mood' | 'olive' | 'pink' | 'accent'

export { BlockTypes, Themes }
