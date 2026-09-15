import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { elementsFolder } from '../../folders';

export const elementStepBlock = defineBlock({
  name: 'element_step',
  display_name: 'Step',
  is_root: false,
  is_nestable: true,
  folder: elementsFolder,
  fields: [
    defineField('title', {
      required: true,
      type: 'textarea',
    }),
    defineField('heading', {
      type: 'text',
    }),
    defineField('copy', {
      customize_toolbar: true,
      toolbar: [
        'paragraph',
      ],
      type: 'richtext',
    }),
    defineField('image', {
      type: 'asset',
    }),
    defineField('theme', {
      datasource: 'themes',
      exclude_empty_option: true,
      source: 'internal',
      type: 'option',
      use_uuid: true,
    }),
  ],
});
