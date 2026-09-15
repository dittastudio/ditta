import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockTestimonialBlock = defineBlock({
  name: 'block_testimonial',
  display_name: 'Testimonial',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  fields: [
    defineField('quote', {
      customize_toolbar: true,
      required: true,
      toolbar: [
        'bold',
        'italic',
        'link',
        'paragraph',
        'unset',
      ],
      type: 'richtext',
    }),
    defineField('image', {
      type: 'asset',
    }),
    defineField('name', {
      type: 'text',
    }),
    defineField('position', {
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
