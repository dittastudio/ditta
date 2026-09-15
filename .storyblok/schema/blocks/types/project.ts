import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { typesFolder } from '../../folders';

export const projectBlock = defineBlock({
  name: 'project',
  is_root: true,
  is_nestable: false,
  folder: typesFolder,
  fields: [
    defineField('client', {
      entry_appearance: 'card',
      filter_content_type: [
        'client',
      ],
      required: true,
      source: 'internal_stories',
      type: 'option',
      use_uuid: true,
    }),
    defineField('Credits', {
      allow: [
        'element_link',
      ],
      type: 'bloks',
    }),
    defineField('services', {
      datasource: 'services',
      display_name: 'Services',
      source: 'internal',
      type: 'options',
    }),
    defineField('blocks', {
      allow: [
        'block_cta',
        'block_hero_project',
        'block_media',
        'block_project_overview',
        'block_projects',
        'block_statement',
        'block_testimonial',
        'block_text',
      ],
      type: 'bloks',
    }),
    defineField('tab-277cdce5-532c-4f5c-8c6f-d10a5d70ca9f', {
      display_name: 'Project',
      keys: [
        'client',
        'Credits',
        'services',
      ],
      name: 'tab-277cdce5-532c-4f5c-8c6f-d10a5d70ca9f',
      type: 'tab',
    }),
    defineField('tab-554f4d6b-1445-4095-a716-160ff3edcf74', {
      display_name: 'SEO',
      keys: [
        'seo_title',
        'seo_description',
        'seo_image',
      ],
      name: 'tab-554f4d6b-1445-4095-a716-160ff3edcf74',
      type: 'tab',
    }),
    defineField('tab-6aa7f8d0-ec3e-453b-a4ae-fee0363bbd0a', {
      display_name: 'Preview',
      keys: [
        'media',
        'title',
      ],
      name: 'tab-6aa7f8d0-ec3e-453b-a4ae-fee0363bbd0a',
      type: 'tab',
    }),
    defineField('title', {
      type: 'text',
    }),
    defineField('media', {
      type: 'asset',
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
