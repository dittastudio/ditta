import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockProjectsBlock = defineBlock({
  name: 'block_projects',
  display_name: 'Projects',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  fields: [
    defineField('ticker', {
      type: 'text',
    }),
    defineField('projects', {
      entry_appearance: 'card',
      filter_content_type: [
        'project',
      ],
      source: 'internal_stories',
      type: 'options',
      use_uuid: true,
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
