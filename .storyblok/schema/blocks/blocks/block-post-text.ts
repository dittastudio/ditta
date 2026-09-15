import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockPostTextBlock = defineBlock({
  name: 'block_post_text',
  display_name: 'Post Text',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  color: 'var(--sb-color-accent-background-white)',
  description: '',
  icon: 'align-left',
  fields: [
    defineField('text', {
      customize_toolbar: true,
      toolbar: [
        'bold',
        'list',
        'code',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hrule',
        'italic',
        'link',
        'olist',
        'paragraph',
        'unset',
      ],
      type: 'richtext',
    }),
    defineField('isSummary', {
      type: 'boolean',
    }),
    defineField('spacing_top', {
      inline_label: true,
      type: 'boolean',
    }),
    defineField('spacing_bottom', {
      default_value: true,
      inline_label: true,
      type: 'boolean',
    }),
  ],
});
