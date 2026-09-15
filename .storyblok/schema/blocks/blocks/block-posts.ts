import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockPostsBlock = defineBlock({
  name: 'block_posts',
  display_name: 'Posts',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  color: 'var(--sb-color-accent-background-white)',
  description: '',
  icon: 'layout-list',
  fields: [
    defineField('id', {
      type: 'text',
    }),
    defineField('theme', {
      datasource: 'themes',
      default_value: 'light',
      exclude_empty_option: true,
      source: 'internal',
      type: 'option',
      use_uuid: true,
    }),
    defineField('spacing_top', {
      default_value: true,
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
