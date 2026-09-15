import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockStepsBlock = defineBlock({
  name: 'block_steps',
  display_name: 'Steps',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
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
        'italic',
        'unset',
        'paragraph',
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
    defineField('steps', {
      allow: [
        'element_step',
      ],
      type: 'bloks',
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
