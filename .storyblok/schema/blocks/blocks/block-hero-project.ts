import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockHeroProjectBlock = defineBlock({
  name: 'block_hero_project',
  display_name: 'Hero Project',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  fields: [
    defineField('image', {
      display_name: 'Image',
      filetypes: [
        'images',
      ],
      required: true,
      type: 'asset',
    }),
    defineField('heading', {
      display_name: 'Heading',
      required: true,
      type: 'text',
    }),
    defineField('copy', {
      customize_toolbar: true,
      display_name: 'Copy',
      toolbar: [
        'bold',
        'italic',
        'link',
        'paragraph',
        'unset',
      ],
      type: 'richtext',
    }),
    defineField('theme', {
      datasource: 'themes',
      default_value: 'light',
      display_name: 'Theme',
      exclude_empty_option: true,
      source: 'internal',
      type: 'option',
      use_uuid: true,
    }),
    defineField('id', {
      display_name: 'ID',
      type: 'text',
    }),
  ],
});
