import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { elementsFolder } from '../../folders';

export const elementAccordionBlock = defineBlock({
  name: 'element_accordion',
  display_name: 'Accordion Item',
  is_root: false,
  is_nestable: true,
  folder: elementsFolder,
  description: '',
  fields: [
    defineField('heading', {
      required: true,
      type: 'text',
    }),
    defineField('copy', {
      allow_target_blank: true,
      customize_toolbar: true,
      required: true,
      toolbar: [
        'bold',
        'list',
        'unset',
        'italic',
        'link',
        'olist',
        'paragraph',
      ],
      type: 'richtext',
    }),
  ],
});
