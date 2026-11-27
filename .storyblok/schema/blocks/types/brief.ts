import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { typesFolder } from '../../folders';

// The brief builder's page (/brief): its intro screen and SEO. The questions live in code (shared/utils/brief.ts),
// and the page falls back to its own wording when a field is empty.
export const briefBlock = defineBlock({
  name: 'brief',
  display_name: 'Brief',
  is_root: true,
  is_nestable: false,
  folder: typesFolder,
  description: 'The brief builder at /brief. One story only, at the root, with the slug "brief": keep that slug, as the page lives at that address.',
  fields: [
    defineField('intro_heading', {
      display_name: 'Intro heading',
      description: 'Defaults to "Create your brief".',
      type: 'text',
    }),
    defineField('intro_copy', {
      display_name: 'Intro copy',
      description: 'Defaults to "A few quick questions about you and your project. Only takes a few minutes."',
      type: 'textarea',
    }),
    defineField('tab-seo', {
      display_name: 'SEO',
      keys: [
        'seo_title',
        'seo_description',
        'seo_image',
      ],
      type: 'tab',
    }),
    defineField('seo_title', {
      display_name: 'Title',
      type: 'text',
    }),
    defineField('seo_description', {
      display_name: 'Description',
      type: 'text',
    }),
    defineField('seo_image', {
      description: 'For best results, use an image size of 1200px by 630px.',
      display_name: 'Image',
      filetypes: [
        'images',
      ],
      type: 'asset',
    }),
  ],
});
