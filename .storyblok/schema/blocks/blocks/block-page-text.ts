import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockPageTextBlock = defineBlock({
  name: 'block_page_text',
  display_name: 'Page Text',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  description: '',
  icon: 'align-left',
  fields: [
    defineField('text', {
      customize_toolbar: true,
      toolbar: [
        'paragraph',
        'link',
        'list',
        'olist',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'bold',
        'italic',
        'unset',
      ],
      type: 'richtext',
    }),
    defineField('theme', {
      datasource: 'themes',
      default_value: 'light',
      exclude_empty_option: true,
      source: 'internal',
      type: 'option',
      use_uuid: true,
    }),
    defineField('id', {
      type: 'text',
    }),
    defineField('spacing_top', {
      default_value: true,
      display_name: 'Spacing Top',
      inline_label: true,
      type: 'boolean',
    }),
    defineField('spacing_bottom', {
      default_value: true,
      display_name: 'Spacing Bottom',
      inline_label: true,
      type: 'boolean',
    }),
  ],
});
