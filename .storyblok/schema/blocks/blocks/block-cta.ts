import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockCtaBlock = defineBlock({
  name: 'block_cta',
  display_name: 'CTA',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  fields: [
    defineField('text', {
      type: 'textarea',
    }),
    defineField('button', {
      allow: [
        'element_cta',
      ],
      maximum: 1,
      type: 'bloks',
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
