import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder, typesFolder } from '../../folders';

export const postBlock = defineBlock({
  name: 'post',
  display_name: 'Post',
  is_root: true,
  is_nestable: false,
  folder: typesFolder,
  fields: [
    defineField('summary', {
      type: 'text',
    }),
    defineField('tags', {
      datasource: 'tags',
      exclude_empty_option: true,
      source: 'internal',
      type: 'options',
    }),
    defineField('blocks', {
      allow: [
        blocksFolder,
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
