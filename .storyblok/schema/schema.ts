import { defineSchema } from '@storyblok/schema';
import type { Schema as InferSchema, Story as InferStory } from '@storyblok/schema';
import type { BlockContent, MapiStory as InferStoryMapi } from '@storyblok/schema';

import { blockAccordionBlock } from './blocks/blocks/block-accordion';
import { blockAiQuoteBlock }  from './blocks/blocks/block-ai-quote';
import { blockCompaniesBlock } from './blocks/blocks/block-companies';
import { blockCtaBlock } from './blocks/blocks/block-cta';
import { blockHeroBlock } from './blocks/blocks/block-hero';
import { blockHeroProjectBlock } from './blocks/blocks/block-hero-project';
import { blockMediaBlock } from './blocks/blocks/block-media';
import { blockPostsBlock } from './blocks/blocks/block-posts';
import { blockPostTextBlock } from './blocks/blocks/block-post-text';
import { blockProjectOverviewBlock } from './blocks/blocks/block-project-overview';
import { blockProjectsBlock } from './blocks/blocks/block-projects';
import { blockServicesBlock } from './blocks/blocks/block-services';
import { blockStatementBlock } from './blocks/blocks/block-statement';
import { blockStepsBlock } from './blocks/blocks/block-steps';
import { blockTeamBlock } from './blocks/blocks/block-team';
import { blockTestimonialBlock } from './blocks/blocks/block-testimonial';
import { blockTextBlock } from './blocks/blocks/block-text';
import { clientBlock } from './blocks/types/client';
import { elementAccordionBlock } from './blocks/elements/element-accordion';
import { elementCtaBlock } from './blocks/elements/element-cta';
import { elementLinkBlock } from './blocks/elements/element-link';
import { elementMediaAutoplayBlock } from './blocks/elements/element-media-autoplay';
import { elementMediaImageBlock } from './blocks/elements/element-media-image';
import { elementStepBlock } from './blocks/elements/element-step';
import { elementTickerBlock } from './blocks/element-ticker';
import { elementTitleBlock } from './blocks/elements/element-title';
import { pageBlock } from './blocks/types/page';
import { personBlock } from './blocks/types/person';
import { postBlock } from './blocks/types/post';
import { projectBlock } from './blocks/types/project';
import { seoBlock } from './blocks/seo';
import { settingsBlock } from './blocks/settings';
import { ratiosDatasource } from './datasources/ratios';
import { servicesDatasource } from './datasources/services';
import { themesDatasource } from './datasources/themes';
import { placementDatasource } from './datasources/placement';
import { tagsDatasource } from './datasources/tags';
import { blocksFolder, elementsFolder, typesFolder } from './folders';

export const schema = defineSchema({
  blocks: {
    blockAccordionBlock,
    blockAiQuoteBlock,
    blockCompaniesBlock,
    blockCtaBlock,
    blockHeroBlock,
    blockHeroProjectBlock,
    blockMediaBlock,
    blockPostsBlock,
    blockPostTextBlock,
    blockProjectOverviewBlock,
    blockProjectsBlock,
    blockServicesBlock,
    blockStatementBlock,
    blockStepsBlock,
    blockTeamBlock,
    blockTestimonialBlock,
    blockTextBlock,
    clientBlock,
    elementAccordionBlock,
    elementCtaBlock,
    elementLinkBlock,
    elementMediaAutoplayBlock,
    elementMediaImageBlock,
    elementStepBlock,
    elementTickerBlock,
    elementTitleBlock,
    pageBlock,
    personBlock,
    postBlock,
    projectBlock,
    seoBlock,
    settingsBlock,
  },
  datasources: {
    ratiosDatasource,
    servicesDatasource,
    themesDatasource,
    placementDatasource,
    tagsDatasource,
  },
  folders: {
    blocksFolder,
    elementsFolder,
    typesFolder,
  },
});

export type Schema = InferSchema<typeof schema>;
export type Blocks = Schema['blocks'];
export type FieldPlugins = Schema['fieldPlugins'];
export type Story = InferStory<Blocks, FieldPlugins>;
export type StoryMapi = InferStoryMapi<Blocks, FieldPlugins>;

// Type a component's props by block name: `Block<"hero">`.
export type Block<TName extends Blocks['name']> = BlockContent<
  Extract<Blocks, { name: TName }>,
  Blocks,
  FieldPlugins
>;

// Loose union of every block's content, for a dynamic component dispatcher.
export type AnyBlock = BlockContent<Blocks, Blocks, FieldPlugins>;
