import type { Block } from '#storyblok-schema'

type PageBlockTypes = NonNullable<Block<'page'>['blocks']>[number]

type Themes = 'dark' | 'light' | 'white' | 'beige' | 'crema' | 'forest' | 'grey' | 'mood' | 'olive' | 'pink' | 'accent'

export { PageBlockTypes, Themes }
