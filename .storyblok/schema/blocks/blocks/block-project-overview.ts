import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockProjectOverviewBlock = defineBlock({
  name: 'block_project_overview',
  display_name: 'Project Overview',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  description: '',
  fields: [
    defineField('heading', {
      required: true,
      type: 'textarea',
    }),
    defineField('copy', {
      customize_toolbar: true,
      required: true,
      toolbar: [
        'bold',
        'unset',
        'italic',
        'paragraph',
      ],
      type: 'richtext',
    }),
    defineField('theme', {
      datasource: 'themes',
      default_value: 'beige',
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
