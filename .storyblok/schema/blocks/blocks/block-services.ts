import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockServicesBlock = defineBlock({
  name: 'block_services',
  display_name: 'Services',
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
    defineField('services', {
      allow: [
        'element_title',
      ],
      datasource: 'services',
      display_name: 'Services',
      source: 'internal',
      type: 'options',
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
