import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { typesFolder } from '../../folders';

export const pageBlock = defineBlock({
  name: 'page',
  is_root: true,
  is_nestable: false,
  folder: typesFolder,
  fields: [
    defineField('blocks', {
      allow: [
        'block_accordion',
        'block_companies',
        'block_cta',
        'block_hero',
        'block_hero_project',
        'block_media',
        'block_posts',
        'block_project_overview',
        'block_projects',
        'block_services',
        'block_statement',
        'block_steps',
        'block_team',
        'block_testimonial',
        'block_text',
      ],
      type: 'bloks',
    }),
    defineField('tab-554f4d6b-1445-4095-a716-160ff3edcf74', {
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
      required: true,
      type: 'text',
    }),
    defineField('seo_description', {
      display_name: 'Description',
      required: true,
      type: 'text',
    }),
    defineField('seo_image', {
      description: 'For best results, use an image size of 1200px by 630px.',
      display_name: 'Image',
      filetypes: [
        'images',
      ],
      required: true,
      type: 'asset',
    }),
  ],
});
